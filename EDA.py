import pandas as pd
from pathlib import Path
import os
import seaborn as sns
import matplotlib.pyplot as plt

import geopandas as gpd
import contextily as ctx

import data_loader
import config

def get_column_count(df, column, mapping=None, max_num_categories=20, save=False):
    """
    Create a bar chart of the value counts of the column
    """

    try:
        df_counts = df.groupby(column)['Crime ID'].count().reset_index(name='Count')

        # Apply the mapping
        if mapping is not None:
            df_counts[column] = df_counts[column].map(mapping)

        # limit to the top max_num_categories most common column values
        if len(df_counts) > max_num_categories:
            df_counts = df_counts.sort_values(by='Count', ascending=False).head(max_num_categories)

        ax = sns.barplot(x=column, y='Count', data=df_counts)
        fig = ax.get_figure()
        fig.suptitle(f'Value counts of {column}')

        # Show the plot
        plt.show()

        if save:
            # Check if /images/ subdir exists
            if not Path("images/").exists():
                os.mkdir(Path("images/"))

            # Save plot
            fig.savefig(Path("images") / f"{column.lower().replace(' ', '_')}_value_counts.png")
    except:
        print(f'Failed to plot the value counts of {column}.')

def plot_boundary(data=None, save=False):
    """
    Plot the LSOA borders.
    """

    # Load the data
    if data is not None:
        try:
            data = gpd.read_file('./raw data/boundaries/Lower_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC_V5_-7764840717091613250.geojson')
        except:
            print(f'Failed to load the LSOA .geojson file.')

            return None
    
    data = data.to_crs(epsg=3857)

    fig, ax = plt.subplots(figsize=(10, 10))
    data.plot(ax=ax, edgecolor='red', facecolor='none', linewidth=1)

    ctx.add_basemap(ax, source=ctx.providers.OpenStreetMap.Mapnik)

    plt.title("LSOA Boundaries")
    plt.axis("off")
    plt.show()

    if save:
        # Check if /images/ subdir exists
        if not Path("images/").exists():
            os.mkdir(Path("images/"))

        # Save plot
        fig.savefig(Path("images") / "LSOA_boundaries.png")

def plot_all_plots(df, save=False):
    """
    This function plots all plots that could be generated with the EDA functions.
    """

    # Bar charts
    get_column_count(df, 'Month', mapping=config.month_mapping, save=save)
    get_column_count(df, 'Reported by', save=save)
    get_column_count(df, 'Falls within', save=save)
    get_column_count(df, 'LSOA name', max_num_categories=5, save=save)
    get_column_count(df, 'Last outcome category', max_num_categories=5, save=save)

    # LSOA borders
    plot_boundary(save=save)

def plot_time_series_histogram(series=None, bins=None, title='Histogram of Time Series', pic_name=None):
    """
    Plot a histogram of a series/DataFrame column.
    """

    # Load the data
    if series is not None:
        try:
            series = pd.Series(series)

            fig = plt.figure(figsize=(8, 6))
            plt.hist(series.dropna(), bins=(bins if bins is not None else len(series.unique())), edgecolor='black', alpha=0.7)
            plt.title(title)
            plt.xlabel('Value')
            plt.ylabel('Frequency')
            plt.grid(axis='y', linestyle='--', alpha=0.7)
            plt.show()

            if pic_name is not None:
                # Check if /images/ subdir exists
                if not Path("images/").exists():
                    os.mkdir(Path("images/"))

                # Save plot
                fig.savefig(Path("images") / f"{pic_name}.png")
        except:
            print(f'Failed to plot the histogram.')

if __name__ == "__main__":
    data = data_loader.load_data('./data/metropolitan-burglary-combined.csv')
    
    plot_all_plots(data, True)