import geopandas as gpd
import pandas as pd
import numpy as np
import pathlib
WEB_DATA_DIR = pathlib.Path("/Users/octaviancravcenco/Downloads/Data-Challenge-2/dashboard/webdata")
PRED_CSV_PATH = pathlib.Path("/Users/octaviancravcenco/Downloads/prediction_for_april_5100_LSOAs.csv")

pred_df = pd.read_csv(PRED_CSV_PATH)
pred_df = pred_df.rename(columns={"LSOA code": "lsoa21cd", "predicted_monthly_count": "pred"})
pred_df["lsoa21cd"] = pred_df["lsoa21cd"].astype(str).str.strip().str.upper()

geojson_files = list(WEB_DATA_DIR.glob("lsoas_*.geojson"))
print(f"Found {len(geojson_files)} GeoJSONs to update.")

#process lsoas within ward
for geojson_path in geojson_files:
    gdf = gpd.read_file(geojson_path)
    code_key = next(c for c in gdf.columns if c.lower().startswith("lsoa") and c.lower().endswith("cd"))
    gdf[code_key] = gdf[code_key].astype(str).str.strip().str.upper()

    #merge predicted values
    merged = gdf.merge(pred_df[["lsoa21cd", "pred"]], left_on=code_key, right_on="lsoa21cd", how="left")

    #normalize within the file
    merged["pred"] = merged["pred"].fillna(0)
    min_y, max_y = merged["pred"].min(), merged["pred"].max()

    if max_y > min_y:
        merged["risk_score"] = ((merged["pred"] - min_y) / (max_y - min_y)) * 10
    else:
        merged["risk_score"] = 0

    total_risk = merged["risk_score"].sum()
    merged["allocation_hours"] = np.where(total_risk > 0, merged["risk_score"] / total_risk * 800, 0)
    merged["patrol_units"] = (merged["allocation_hours"] / 2).round().astype(int)

    merged = merged.drop(columns=["pred"], errors="ignore")

    merged.to_file(geojson_path, driver="GeoJSON")
    print(f"✓ updated {geojson_path.name} — {len(merged)} LSOAs")
