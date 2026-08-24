#!/usr/bin/env python
"""
build_london_drilldown.py
─────────────────────────
Creates an interactive Borough ▶ Ward ▶ LSOA map for London.
Everything is written to dashboard/webdata/ :

    webdata/
        borough_*.geojson
        wards_<B>.geojson
        lsoas_<Ward>.geojson
        map_london_drilldown.html
"""
import folium, geopandas as gpd, pandas as pd
import zipfile, tempfile, pathlib, shutil, json, re

# ── basic paths ───────────────────────────────────────────────────
HERE = pathlib.Path(__file__).parent
OUT  = HERE / "webdata"
OUT.mkdir(exist_ok=True)

ZIP_WARDS = HERE / "London-wards-2018.zip"
ZIP_LSOA  = HERE / "LB_LSOA2021_shp (1).zip"
WARD_SHP  = "./temp/London-wards-2018/London-wards-2018_ESRI/London_Ward.shp"      # inside wards ZIP

# ── attribute names in source data ────────────────────────────────
WARD_CODE, WARD_NAME, BORO_NAME = "GSS_CODE", "NAME", "DISTRICT"
LSOA_CODE, LSOA_NAME            = "lsoa21cd", "lsoa21nm"

slug = lambda s: re.sub(r"[^A-Za-z0-9_-]+", "_", s)

# ── 1.  wards ------------------------------------------------------
wards = gpd.read_file(f"zip://{ZIP_WARDS}!{WARD_SHP}").to_crs(4326)

# ── 2.  LSOAs (all borough files) ---------------------------------
tmp = pathlib.Path(tempfile.mkdtemp())
with zipfile.ZipFile(ZIP_LSOA) as z:
    z.extractall(tmp)
lsoas = (pd.concat([gpd.read_file(p) for p in tmp.rglob("*.shp")], ignore_index=True)
           .pipe(gpd.GeoDataFrame).to_crs(4326))
shutil.rmtree(tmp, ignore_errors=True)

# attach ward code to each LSOA (simple join)
lsoas = lsoas.sjoin(wards[[WARD_CODE, "geometry"]],
                    how="left", predicate="intersects").dropna(subset=[WARD_CODE])

# ── 3.  write GeoJSONs -------------------------------------------
def write(gdf, fn): gdf.to_file(OUT / fn, driver="GeoJSON")

boroughs = wards.dissolve(by=BORO_NAME, as_index=False)
for _, r in boroughs.iterrows():
    write(gpd.GeoDataFrame([r], crs=boroughs.crs),
          f"borough_{slug(r[BORO_NAME])}.geojson")
for b, g in wards.groupby(BORO_NAME):
    write(g, f"wards_{slug(b)}.geojson")
for w, g in lsoas.groupby(WARD_CODE):
    write(g, f"lsoas_{slug(w)}.geojson")

# ── 4.  Folium map (white background) -----------------------------
m   = folium.Map([51.5074, -0.1278], zoom_start=9, tiles=None, control_scale=True)
MAP = m.get_name()
m.get_root().html.add_child(folium.Element(f"<style>#{MAP}{{background:#fff;}}</style>"))

# add borough outlines only (other layers fetched on demand)
for _, r in boroughs.iterrows():
    bslug = slug(r[BORO_NAME])
    folium.GeoJson(
        str((OUT / f"borough_{bslug}.geojson").resolve()),
        name=r[BORO_NAME],
        style_function=lambda f: {"weight":1.5, "color":"#555", "fillOpacity":.05},
        tooltip=folium.GeoJsonTooltip(fields=[BORO_NAME])
    ).add_to(m)
folium.LayerControl(collapsed=True).add_to(m)

# ── 5.  JavaScript: hover + drill-down (all braces doubled) -------
style_js = dict(
    BOR_ST={"weight":1.5,"color":"#555","fillOpacity":.05},
    BOR_HI={"weight":3,"color":"#ff6600","fillOpacity":.35},
    WAR_ST={"weight":1,"color":"#06c","fillColor":"#cce0ff","fillOpacity":.12},
    WAR_HI={"weight":2,"color":"#06c","fillColor":"#bfd6ff","fillOpacity":.35},
    LSO_ST={"weight":.4,"color":"#800080","fillColor":"#eed9f8","fillOpacity":.15},
    LSO_HI={"weight":1.2,"color":"#800080","fillColor":"#e4c2f5","fillOpacity":.35}
)
ward_files = {r[BORO_NAME]: f"webdata/wards_{slug(r[BORO_NAME])}.geojson"
              for _, r in boroughs.iterrows()}

m.get_root().script.add_child(folium.Element(f"""
(function(){{                       /* wait until Leaflet variable exists */
  function ready(){{ 
    const map = window["{MAP}"];
    if (!map) {{ setTimeout(ready, 60); return; }}

    const sty = {json.dumps(style_js)};
    const wFile = {json.dumps(ward_files)};

    const clear = pfx => Object.values(map._layers).forEach(l=>{{ 
      if(l.options && l.options.name && l.options.name.startsWith(pfx)) map.removeLayer(l);
    }});

    /* ─ Borough hover + click ─────────────────────── */
    Object.values(map._layers).forEach(b=>{{ 
      if(!(b.options && b.options.name && wFile[b.options.name])) return;

      b.setStyle(sty.BOR_ST);
      b.on('mouseover',()=>b.setStyle(sty.BOR_HI));
      b.on('mouseout', ()=>b.setStyle(sty.BOR_ST));

      b.on('click',()=>{{ 
        map.flyToBounds(b.getBounds(), {{maxZoom:12}});
        clear('Wards '); clear('LSOAs ');

        fetch(wFile[b.options.name]).then(r=>r.json()).then(gj=>{{ 
          const wards=L.geoJSON(gj,{{ 
            style:sty.WAR_ST,
            onEachFeature:(f,ly)=>{{ 
              ly.bindTooltip(f.properties["{WARD_NAME}"]);
              ly.on('mouseover',()=>ly.setStyle(sty.WAR_HI));
              ly.on('mouseout', ()=>ly.setStyle(sty.WAR_ST));

              ly.on('click',()=>{{ 
                map.flyToBounds(ly.getBounds(), {{maxZoom:14}});
                clear('LSOAs ');

                const code=f.properties["{WARD_CODE}"];
                fetch(`webdata/lsoas_${{code}}.geojson`)
                  .then(r=>r.json()).then(gj2=>{{ 
                    const lso=L.geoJSON(gj2,{{ 
                      style:sty.LSO_ST,
                      onEachFeature:(f2,ly2)=>{{ 
                        ly2.bindTooltip(f2.properties["{LSOA_NAME}"]);
                        ly2.on('mouseover',()=>ly2.setStyle(sty.LSO_HI));
                        ly2.on('mouseout', ()=>ly2.setStyle(sty.LSO_ST));
                      }}
                    }}).addTo(map);
                    lso.options.name='LSOAs '+code;
                  }});
              }});
            }}
          }}).addTo(map);
          wards.options.name='Wards '+b.options.name;
        }});
      }});
    }});
  }}
  ready();
}})();
"""))

# ── 6.  save -------------------------------------------------------
MAP_HTML = OUT / "map_london_drilldown.html"
m.save(MAP_HTML)
print("✓ files written →", OUT.relative_to(HERE))
print('<iframe src="webdata/map_london_drilldown.html" '
      'style="width:100%;height:600px;border:none;" loading="lazy"></iframe>')
