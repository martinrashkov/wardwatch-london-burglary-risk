import geopandas as gpd
import numpy as np
import pathlib

# Path to the folder with your LSOA GeoJSON files
folder = pathlib.Path("dashboard/webdata")

# Loop over all GeoJSONs for LSOAs
for geojson_file in folder.glob("lsoas_*.geojson"):
    print(f"Processing {geojson_file.name}...")

    gdf = gpd.read_file(geojson_file)
    np.random.seed(42)  # Same seed for reproducibility
    gdf["risk_score"] = (np.random.rand(len(gdf)) * 10).round(2)

    # Overwrite file
    gdf.to_file(geojson_file, driver="GeoJSON")

print("All risk scores injected successfully.")
