import pandas as pd
import numpy as np
from pathlib import Path
import os
import geopandas as gpd
import ast

import config

from sklearn.preprocessing import MinMaxScaler


def save_df_as_csv(df, file_name):
    """
    This function saves a DataFrame as a csv in the './data/' folder.
    """

    try:
        # Check if /data/ subdir exists
        if not Path("data/").exists():
            os.mkdir(Path("data/"))

        # Save DataFrame
        df.to_csv(f'./data/{file_name}.csv', encoding='utf-8', index=False)
    except:
        print(f'Failed to save "{file_name}".')


def get_dates():
    """
    This function obtains all months that the dataset covers.
    """

    min_full_year = 2011
    max_full_year = 2024
    prefix = ['2010-12']
    suffix = ['2025-01', '2025-02', '2025-03', '2025-04']

    output = prefix

    for i in range(min_full_year, max_full_year+1):
        for j in range(1, 13):
            output += [f'{i}-{j:02}']

    output += suffix

    return output


def crime_extract_single_month(date):
    """
    Computes a DataFrame from a single monh (file).
    """

    try:
        # Extract the DataFrame
        df = pd.read_csv(
            f'./raw data/crime/{date}/{date}-metropolitan-street.csv')

        # Filter the DataFrame
        df = df[df['Crime type'] == 'Burglary']

        return df
    except:
        print(f'Failed to extract crime for {date}.')
        return None


def crime_combine_data(save=False):
    """
    Combines all csvs from all dates into a single DataFrame.
    """

    print('Started combining crime data.')

    all_dates = get_dates()

    df = crime_extract_single_month(all_dates[0])

    for date in all_dates[1:]:
        new_csv = crime_extract_single_month(date)

        if new_csv is not None:
            df = pd.concat([df, new_csv], axis=0)

    # Rename the Month column to Date
    df.rename(columns={'Month': 'Date'}, inplace=True)

    # Add Year and Month columns
    # Split the 'yyyy-mm' column
    df[['Year', 'Month']] = df['Date'].str.split('-', expand=True)

    # Convert to integers
    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)

    if save:
        save_df_as_csv(df, 'metropolitan-burglary-combined')

    print('Finisheded combining crime data.')

    return df


def load_crime_data():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/metropolitan-burglary-combined.csv')
        return df
    except:
        print(
            f'Failed to load the crime data from ./data/metropolitan-burglary-combined.csv')
        try:
            df = crime_combine_data(True)

            return df
        except:
            print(
                f'Failed to load the combined crime data and to generate the dataset anew.')

            return None


def societal_wellbeing_combine_data(save=False):
    """
    Combines all csvs from 2010, 2015 and 2019 into a single DataFrame.
    """

    print('Started combining societal wellbeing data.')

    # Load the data
    try:
        df_2015 = pd.read_csv(f'./raw data/societal wellbeing/{config.indices_of_deprivation_2015}')
    except:
        print(f'Failed to load "English Indices of Deprivation 2015 - LSOA Level" from "./raw data/societal wellbeing/{config.indices_of_deprivation_2015}".')
        df_2015 = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value', 'Indices of Deprivation'])
    try:
        df_2019 = pd.read_csv(f'./raw data/societal wellbeing/{config.indices_of_deprivation_2019}')
    except:
        print(f'Failed to load "English Indices of Deprivation 2019 - LSOA Level" from "./raw data/societal wellbeing/{config.indices_of_deprivation_2019}".')
        df_2019 = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value', 'Indices of Deprivation'])

    try:
        df_score_2010 = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010}')
    except:
        print(f'Failed to load "Index of Multiple Deprivation Score, 2010" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010}".')
        df_score_2010 = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_crime_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_crime_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Crime Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_crime_score}".')
        df_2010_crime_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_education_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_education_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Education Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_education_score}".')
        df_2010_education_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_employment_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_employment_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Employment Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_employment_score}".')
        df_2010_employment_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_environment_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_environment_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Environment Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_environment_score}".')
        df_2010_environment_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_health_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_health_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Health Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_health_score}".')
        df_2010_health_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_housing_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_housing_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Housing Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_housing_score}".')
        df_2010_housing_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])
    try:
        df_2010_income_score = pd.read_csv(f'./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_income_score}')
    except:
        print(f'Failed to load "Indices of Multiple Deprivation 2010, Income Score" from "./raw data/societal wellbeing/{config.index_of_multiple_deprivation_score_2010_income_score}".')
        df_2010_income_score = pd.DataFrame(columns=['FeatureCode', 'DateCode', 'Measurement', 'Units', 'Value'])

    # Compute the 2010 DataFrame

    # Add the 'Category' column to each DataFrame
    df_score_2010['Category'] = 'IMD'
    df_2010_crime_score['Category'] = 'Crime'
    df_2010_education_score['Category'] = 'Education'
    df_2010_employment_score['Category'] = 'Employment'
    df_2010_environment_score['Category'] = 'Environment'
    df_2010_health_score['Category'] = 'Health'
    df_2010_housing_score['Category'] = 'Housing'
    df_2010_income_score['Category'] = 'Income'

    # Combine the 2010 data into a single DataFrame
    df_2010 = pd.concat([df_score_2010,
                         df_2010_crime_score,
                         df_2010_education_score,
                         df_2010_employment_score,
                         df_2010_environment_score,
                         df_2010_health_score,
                         df_2010_housing_score,
                         df_2010_income_score], axis=0)

    # Filter the 2015 and 2019 data to only contain 'scores'
    df_2015 = df_2015[df_2015['Measurement'] == 'Score']
    df_2019 = df_2019[df_2019['Measurement'] == 'Score']

    # Map the 'Indices of Deprication' (later split into different columns) to simpler categories
    categories_map = {
        'a. Index of Multiple Deprivation (IMD)': 'IMD',
        'b. Income Deprivation Domain': 'Income',
        'c. Employment Deprivation Domain': 'Employment',
        'd. Education, Skills and Training Domain': 'Education',
        'e. Health Deprivation and Disability Domain': 'Health',
        'f. Crime Domain': 'Crime',
        'g. Barriers to Housing and Services Domain': 'Housing',
        'h. Living Environment Deprivation Domain': 'Environment',
        'i. Income Deprivation Affecting Children Index (IDACI)': 'IDACI',
        'j. Income Deprivation Affecting Older People Index (IDAOPI)': 'IDAOPI',
    }
    df_2015['Category'] = df_2015['Indices of Deprivation'].map(categories_map)
    df_2019['Category'] = df_2019['Indices of Deprivation'].map(categories_map)

    # Keep only neccessary columns
    df_2010 = df_2010.loc[:, ['FeatureCode', 'DateCode', 'Value', 'Category']]
    df_2015 = df_2015.loc[:, ['FeatureCode', 'DateCode', 'Value', 'Category']]
    df_2019 = df_2019.loc[:, ['FeatureCode', 'DateCode', 'Value', 'Category']]

    # Rename the columns
    df_2010.rename(columns={'FeatureCode': 'LSOA code', 'DateCode': 'Year', 'Value': 'Value', 'Category': 'Category'}, inplace=True)
    df_2015.rename(columns={'FeatureCode': 'LSOA code', 'DateCode': 'Year', 'Value': 'Value', 'Category': 'Category'}, inplace=True)
    df_2019.rename(columns={'FeatureCode': 'LSOA code', 'DateCode': 'Year', 'Value': 'Value', 'Category': 'Category'}, inplace=True)

    # Combine the DataFrames
    df = pd.concat([df_2010, df_2015, df_2019], axis=0)

    # Flatten out the DataFrame
    df = df.pivot(index=['LSOA code', 'Year'], columns='Category', values='Value').reset_index()

    if save:
        save_df_as_csv(df, 'societal-wellbeing-combined')

    print('Finished combining societal wellbeing data.')

    return df


def load_societal_wellbeing_data():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/societal-wellbeing-combined.csv')

        return df
    except:
        print(f'Failed to load the societal wellbeing data from ./data/societal-wellbeing-combined.csv')
        try:
            df = societal_wellbeing_combine_data(True)

            return df
        except:
            print(
                f'Failed to load the combined societal wellbeing data and to generate the dataset anew.')

            return None


def economic_activity_combine_data(save=False):
    """
    Combines all economic activities for 2011 and 2021 into a single DataFrame.
    """

    print('Started combining economic activity data.')

    # Load the data
    try:
        economic_activity_2011 = pd.read_excel(
            './raw data/other/Economic Activity.xlsx', sheet_name='2011')
    except:
        print(f'Failed to load the economic activity for 2011.')
        economic_activity_2011 = pd.DataFrame(columns=['local authority code', 'local authority name', 'LSOA code',
                                                       'All usual residents aged 16-74 ',
                                                       'Economically active: Employee: Full-time',
                                                       'Economically active: Employee: Part-time',
                                                       'Economically active: Full-time student',
                                                       'Economically active: Self-employed with employees: Full-time',
                                                       'Economically active: Self-employed with employees: Part-time',
                                                       'Economically active: Self-employed without employees: Full-time',
                                                       'Economically active: Self-employed without employees: Part-time',
                                                       'Economically active: Unemployed',
                                                       'Economically inactive: Long-term sick or disabled',
                                                       'Economically inactive: Looking after home or family',
                                                       'Economically inactive: Other', 'Economically inactive: Retired',
                                                       'Economically inactive:  Full-time students'])

    try:
        economic_activity_2021 = pd.read_excel(
            './raw data/other/Economic Activity.xlsx', sheet_name='2021')
    except:
        print(f'Failed to load the economic activity for 2021.')
        economic_activity_2021 = pd.DataFrame(columns=['local authority code', 'local authority name', 'LSOA code',
                                                       'All usual residents aged 16 or over',
                                                       'Economically active: Employee: Full-time',
                                                       'Economically active: Employee: Part-time',
                                                       'Economically active: Full-time student',
                                                       'Economically active: Self-employed with employees: Full-time',
                                                       'Economically active: Self-employed with employees: Part-time',
                                                       'Economically active: Self-employed without employees: Full-time',
                                                       'Economically active: Self-employed without employees: Part-time',
                                                       'Economically active: Unemployed',
                                                       'Economically inactive: Long-term sick or disabled',
                                                       'Economically inactive: Looking after home or family',
                                                       'Economically inactive: Other', 'Economically inactive: Retired',
                                                       'Economically inactive:  Full-time students'])

    # Add the corresponding year
    economic_activity_2011['Year'] = 2011
    economic_activity_2021['Year'] = 2021

    # Make the 'All usual residents aged 16-74 ' column for 2011 the same as the one for 2021
    economic_activity_2011.rename(columns={'All usual residents aged 16-74 ': 'All usual residents aged 16 or over'}, inplace=True)

    df = pd.concat([economic_activity_2011, economic_activity_2021], axis=0)

    if save:
        save_df_as_csv(df, 'economic-activity-combined')

    print('Finished combining economic activity data.')

    return df


def load_economic_activity_data():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/economic-activity-combined.csv')

        return df
    except:
        print(f'Failed to load the economic activity data from ./data/economic-activity-combined.csv')
        try:
            df = economic_activity_combine_data(True)

            return df
        except:
            print(
                f'Failed to load the combined economic activity data and to generate the dataset anew.')

            return None


def age_distribution_combine_data(save=False):
    """
    Combines all age distribution data into a single DataFrame.
    """

    print('Started combining age distribution data.')

    # Load the data
    try:
        age_distribution = pd.read_excel(
            './raw data/other/age distribution.xlsx', sheet_name='Mid-2021 LSOA 2021', skiprows=3)
    except:
        print(f'Failed to load the age distribution xlsx file.')
        age_distribution = pd.DataFrame(columns=['LSOA code',
                                                 'Number M 15-24',
                                                 'Number M 25-34',
                                                 'Number F 15-24',
                                                 'Number F 25-34'])

    df = age_distribution[['LSOA 2021 Code', 'Number M 15-24',
                           'Number M 25-34', 'Number F 15-24', 'Number F 25-34']]

    df.rename(columns={'LSOA 2021 Code': 'LSOA code'}, inplace=True)

    df['Year'] = 2021

    if save:
        save_df_as_csv(df, 'age-distribution-combined')

    print('Finished combining age distribution data.')

    return df


def load_age_distribution_data():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/age-distribution-combined.csv')

        return df
    except:
        print(f'Failed to load the age distribution data from ./data/age-distribution-combined.csv')
        try:
            df = age_distribution_combine_data(True)

            return df
        except:
            print(
                f'Failed to load the age distribution data and to generate the dataset anew.')

            return None


def population_density_combine_data(save=False):
    """
    Combines all population density data into a single DataFrame.
    """

    print('Started combining population density data.')

    # Load the data
    try:
        population_density = pd.read_excel(
            './raw data/other/sapelsoapopulationdensity20112022.xlsx', sheet_name='Mid-2011 to mid-2022 LSOA 2021', skiprows=3)
    except:
        print(f'Failed to load the population density data.')
        population_density = pd.DataFrame(
            columns=['LSOA code', 'Area', 'Population', 'Density', 'Year'])
        return population_density

    # Extract the population density information per year
    population_density_2011 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2011: Population', 'Mid-2011: People per Sq Km']].copy()
    population_density_2011.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2011: Population': 'Population', 'Mid-2011: People per Sq Km': 'Density'}, inplace=True)
    population_density_2011['Year'] = 2011

    population_density_2012 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2012: Population', 'Mid-2012: People per Sq Km']].copy()
    population_density_2012.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2012: Population': 'Population', 'Mid-2012: People per Sq Km': 'Density'}, inplace=True)
    population_density_2012['Year'] = 2012

    population_density_2013 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2013: Population', 'Mid-2013: People per Sq Km']].copy()
    population_density_2013.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2013: Population': 'Population', 'Mid-2013: People per Sq Km': 'Density'}, inplace=True)
    population_density_2013['Year'] = 2013

    population_density_2014 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2014: Population', 'Mid-2014: People per Sq Km']].copy()
    population_density_2014.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2014: Population': 'Population', 'Mid-2014: People per Sq Km': 'Density'}, inplace=True)
    population_density_2014['Year'] = 2014

    population_density_2015 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2015: Population', 'Mid-2015: People per Sq Km']].copy()
    population_density_2015.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2015: Population': 'Population', 'Mid-2015: People per Sq Km': 'Density'}, inplace=True)
    population_density_2015['Year'] = 2015

    population_density_2016 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2016: Population', 'Mid-2016: People per Sq Km']].copy()
    population_density_2016.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2016: Population': 'Population', 'Mid-2016: People per Sq Km': 'Density'}, inplace=True)
    population_density_2016['Year'] = 2016

    population_density_2017 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2017: Population', 'Mid-2017: People per Sq Km']].copy()
    population_density_2017.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2017: Population': 'Population', 'Mid-2017: People per Sq Km': 'Density'}, inplace=True)
    population_density_2017['Year'] = 2017

    population_density_2018 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2018: Population', 'Mid-2018: People per Sq Km']].copy()
    population_density_2018.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2018: Population': 'Population', 'Mid-2018: People per Sq Km': 'Density'}, inplace=True)
    population_density_2018['Year'] = 2018

    population_density_2019 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2019: Population', 'Mid-2019: People per Sq Km']].copy()
    population_density_2019.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2019: Population': 'Population', 'Mid-2019: People per Sq Km': 'Density'}, inplace=True)
    population_density_2019['Year'] = 2019

    population_density_2020 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2020: Population', 'Mid-2020: People per Sq Km']].copy()
    population_density_2020.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2020: Population': 'Population', 'Mid-2020: People per Sq Km': 'Density'}, inplace=True)
    population_density_2020['Year'] = 2020

    population_density_2021 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2021: Population', 'Mid-2021: People per Sq Km']].copy()
    population_density_2021.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2021: Population': 'Population', 'Mid-2021: People per Sq Km': 'Density'}, inplace=True)
    population_density_2021['Year'] = 2021

    population_density_2022 = population_density[[
        'LSOA 2021 Code', 'Area Sq Km', 'Mid-2022: Population', 'Mid-2022: People per Sq Km']].copy()
    population_density_2022.rename(columns={'LSOA 2021 Code': 'LSOA code', 'Area Sq Km': 'Area',
                                   'Mid-2022: Population': 'Population', 'Mid-2022: People per Sq Km': 'Density'}, inplace=True)
    population_density_2022['Year'] = 2022

    df = pd.concat([population_density_2011,
                    population_density_2012,
                    population_density_2013,
                    population_density_2014,
                    population_density_2015,
                    population_density_2016,
                    population_density_2017,
                    population_density_2018,
                    population_density_2019,
                    population_density_2020,
                    population_density_2021,
                    population_density_2022], axis=0)

    if save:
        save_df_as_csv(df, 'population-density-combined')

    print('Finished combining population density data.')

    return df


def load_population_density():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/population-density-combined.csv')

        return df
    except:
        print(f'Failed to load the population density data from ./data/population-density-combined.csv')
        try:
            df = population_density_combine_data(True)

            return df
        except:
            print(
                f'Failed to load the population density data and to generate the dataset anew.')

            return None


def compute_burglary_counts(save=False):
    """
    Takes the crime data as returned by load_crime_data and computes a DataFrame of the number of crimes per LSOA per month.
    """

    print('Started computing burglary counts.')

    crime = load_crime_data()

    crime = crime[crime['Year'] > 2021]

    # Get the count of the burglaries per LSOA rof each unique date
    df = crime.groupby(['LSOA code', 'Date']).agg(
        crime_count=('Crime ID', 'size'),
        Falls_within=('Falls within', 'first'),
        LSOA_name=('LSOA name', 'first'),
        Year=('Year', 'first'),
        Month=('Month', 'first')
    ).reset_index()

    # Add sin and cos month representation
    df["month_sin"] = np.sin(2 * np.pi * df["Month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["Month"] / 12)

    # Add missing 0 crime counts
    all_lsoas = df["LSOA code"].unique()
    full_index = pd.MultiIndex.from_product(
        [all_lsoas, df["Date"].unique()], names=["LSOA code", "Date"])

    df = df.set_index(["LSOA code", "Date"])
    df = df.reindex(full_index)

    df["crime_count"] = df["crime_count"].fillna(0)

    static_cols = ['Falls_within', 'LSOA_name', 'Year', 'Month', 'month_sin', 'month_cos']
    for col in static_cols:
        if col in df.columns:
            df[col] = df[col].ffill().bfill()

    df = df.reset_index()

    df[['Year', 'Month']] = df['Date'].str.split('-', expand=True)

    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)

    df = df.sort_values(by=['Year', 'Month', 'LSOA code']).reset_index(drop=True)

    if save:
        save_df_as_csv(df, 'burglary-count')

    print('Finished computing burglary counts.')

    return df


def load_burglary_counts():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/burglary-count.csv')

        return df
    except:
        print(f'Failed to load the burglary count data from ./data/burglary-count.csv')
        try:
            df = compute_burglary_counts(True)

            return df
        except:
            print(
                f'Failed to load the burglary count data and to generate the dataset anew.')

            return None


def combine_LSOA_neighbours_2021(save=False):
    """
    Extract the neighbour LSOA codes for each LSOA and return it as a DataFrame.
    """

    print('Started combining LSOA neighbours data.')

    # Load the data
    try:
        gdf = gpd.read_file('./raw data/boundaries/Lower_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC_V5_-7764840717091613250.geojson')
    except:
        print(f'Failed to load the LSOA .geojson file.')

        return pd.DataFrame(columns=['LSOA code', 'Neighbour LSOA codes', 'Year'])

    gdf = gdf.to_crs(epsg=27700)

    gdf['LSOA code'] = gdf['LSOA21CD']

    gdf['geometry'] = gdf['geometry'].buffer(0)

    neighbours = gpd.sjoin(gdf, gdf, how='inner', predicate='touches')

    neighbours = neighbours[neighbours['LSOA code_left']
                            != neighbours['LSOA code_right']]

    df = neighbours.groupby('LSOA code_left')[
        'LSOA code_right'].apply(list).reset_index()
    df.columns = ['LSOA code', 'Neighbour LSOA codes']
    df['Year'] = 2021

    if save:
        save_df_as_csv(df, 'LSOA-neighbours-2021')

    print('Finished combining LSOA neighbours data.')

    return df


def load_LSOA_neighbours_2021():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/LSOA-neighbours-2021.csv')

        df['Neighbour LSOA codes'] = df['Neighbour LSOA codes'].apply(
            ast.literal_eval)

        return df
    except:
        print(
            f'Failed to load the LSOA neighbours data from ./data/LSOA-neighbours-2021.csv')
        try:
            df = combine_LSOA_neighbours_2021(True)

            return df
        except:
            print(
                f'Failed to load the LSOA neighbours data and to generate the dataset anew.')

            return None


def combine_burglary_counts_and_neighbours(bc, bn):
    """
    Uses the crime counts DataFrame (as returned by load_burglary_counts()) and the neighbourhood LSOA codes DataFrame (as returned by load_LSOA_neighbours_2021())
    and computes the number of neighbours and average neighbour crime count.
    """

    crime_lookup = dict(zip(bc['LSOA code'], bc['crime_count']))

    def compute_stats(row):
        neighbours = row['Neighbour LSOA codes']
        if not isinstance(neighbours, list):
            neighbours = []
        valid_counts = [crime_lookup.get(
            code) for code in neighbours if code in crime_lookup]
        valid_counts = [x for x in valid_counts if x is not None]

        number = len(valid_counts)
        avg = sum(valid_counts) / number if number > 0 else None

        return pd.Series({'number_neighbours': number, 'avg_neighbour_crime_count': avg})

    stats_only = bn.apply(compute_stats, axis=1)
    stats = pd.concat([bn[['LSOA code']], stats_only], axis=1)

    df = pd.merge(bc, bn, on="LSOA code")
    df = pd.merge(df, stats, on="LSOA code")

    return df


def compute_final_data_2022(save=False):
    """
    Takes all datasets that we use and computes a DataFrame with the joint monthly information for 2022 to 2025.
    """

    print('Started computing final dataset for years 2022 and onwards.')

    burglary_count = load_burglary_counts()
    economic_activity = load_economic_activity_data()
    societal_wellbeing = load_societal_wellbeing_data()
    population_density = load_population_density()
    age_distribution = load_age_distribution_data()
    LSOA_neighbours = load_LSOA_neighbours_2021()

    # Split the datasets into the relevant years
    burglary_count_2022 = burglary_count[burglary_count['Year'] == 2022].copy()
    burglary_count_2023 = burglary_count[burglary_count['Year'] == 2023].copy()
    burglary_count_2024 = burglary_count[burglary_count['Year'] == 2024].copy()
    burglary_count_2025 = burglary_count[burglary_count['Year'] == 2025].copy()

    economic_activity_2021 = economic_activity[economic_activity['Year'] == 2021].copy()
    economic_activity_2021.drop(['Year'], axis=1, inplace=True)

    societal_wellbeing_2019 = societal_wellbeing[societal_wellbeing['Year'] == 2019].copy()
    societal_wellbeing_2019.drop(['Year'], axis=1, inplace=True)

    population_density_2022 = population_density[population_density['Year'] == 2022].copy()
    population_density_2022.drop(['Year'], axis=1, inplace=True)

    LSOA_neighbours_2021 = LSOA_neighbours[LSOA_neighbours['Year'] == 2021].copy()
    LSOA_neighbours_2021.drop(['Year'], axis=1, inplace=True)

    age_distribution_2021 = age_distribution[age_distribution['Year'] == 2021].copy()
    age_distribution_2021.drop(['Year'], axis=1, inplace=True)

    # Compute neighbour statistics
    burglary_info_2022 = combine_burglary_counts_and_neighbours(burglary_count_2022, LSOA_neighbours_2021.copy())
    burglary_info_2023 = combine_burglary_counts_and_neighbours(burglary_count_2023, LSOA_neighbours_2021.copy())
    burglary_info_2024 = combine_burglary_counts_and_neighbours(burglary_count_2024, LSOA_neighbours_2021.copy())
    burglary_info_2025 = combine_burglary_counts_and_neighbours(burglary_count_2025, LSOA_neighbours_2021.copy())

    # Combine the DataFrames
    combined_2022 = pd.merge(burglary_info_2022, economic_activity_2021, on="LSOA code", how="left")
    combined_2022 = pd.merge(combined_2022, societal_wellbeing_2019, on="LSOA code", how="left")
    combined_2022 = pd.merge(combined_2022, population_density_2022, on="LSOA code", how="left")
    combined_2022 = pd.merge(combined_2022, age_distribution_2021, on="LSOA code", how="left")

    combined_2023 = pd.merge(burglary_info_2023, economic_activity_2021, on="LSOA code", how="left")
    combined_2023 = pd.merge(combined_2023, societal_wellbeing_2019, on="LSOA code", how="left")
    combined_2023 = pd.merge(combined_2023, population_density_2022, on="LSOA code", how="left")
    combined_2023 = pd.merge(combined_2023, age_distribution_2021, on="LSOA code", how="left")

    combined_2024 = pd.merge(burglary_info_2024, economic_activity_2021, on="LSOA code", how="left")
    combined_2024 = pd.merge(combined_2024, societal_wellbeing_2019, on="LSOA code", how="left")
    combined_2024 = pd.merge(combined_2024, population_density_2022, on="LSOA code", how="left")
    combined_2024 = pd.merge(combined_2024, age_distribution_2021, on="LSOA code", how="left")

    combined_2025 = pd.merge(burglary_info_2025, economic_activity_2021, on="LSOA code", how="left")
    combined_2025 = pd.merge(combined_2025, societal_wellbeing_2019, on="LSOA code", how="left")
    combined_2025 = pd.merge(combined_2025, population_density_2022, on="LSOA code", how="left")
    combined_2025 = pd.merge(combined_2025, age_distribution_2021, on="LSOA code", how="left")

    # Fill NaN values
    combined_2022.fillna(0, inplace=True)
    combined_2023.fillna(0, inplace=True)
    combined_2024.fillna(0, inplace=True)
    combined_2025.fillna(0, inplace=True)

    # Combine DataFrame rows
    df = pd.concat([combined_2022, combined_2023, combined_2024, combined_2025], axis=0)

    # Add normalized values
    excluded_columns = set(burglary_count.columns)
    columns_to_normalize = [col for col in df.columns if col not in excluded_columns and pd.api.types.is_numeric_dtype(df[col])]
    scaler = MinMaxScaler()
    normalized_values = scaler.fit_transform(df[columns_to_normalize])
    for i, col in enumerate(columns_to_normalize):
        df[f"{col} normalized"] = normalized_values[:, i]

    if save:
        save_df_as_csv(df, 'final-data-2022')

    print('Finished computing final dataset for years 2022 and onwards.')

    return df


def load_final_data_2022():
    """
    Extracts a csv file into a DataFrame.
    """

    try:
        df = pd.read_csv('./data/final-data-2022.csv')

        return df
    except:
        print(f'Failed to load the final data 2022 from ./data/final-data-2022.csv')
        try:
            df = compute_final_data_2022(True)

            return df
        except:
            print(f'Failed to load the final data 2022 and to generate the dataset anew.')

            return None


if __name__ == "__main__":
    df = load_final_data_2022()

    print('Final Data:')
    print(df.columns)
    # print(df.head())
    # print(df.groupby('Date')['LSOA code'].nunique())
    unique_LSOA_codes = df['LSOA code'].unique()
    print(df['LSOA code'].nunique())
    print('===============================================================')


    # print(df[df['LSOA_name'] == 'Westminster 019F']['Neighbour LSOA codes'].head(50))
    # print(df[df['LSOA code'] == 'E01035718'].head(50))
    # print(df[df['LSOA_name'].str.match(r'^Westminster 019.')]['LSOA_name'].unique())

    # for column in df.columns:
    #     print(f'Column {column} has {sum(df[column].isna())} NaN values')

    # burglary_count = load_burglary_counts()
    # economic_activity = load_economic_activity_data()
    # societal_wellbeing = load_societal_wellbeing_data()
    # population_density = load_population_density()
    # age_distribution = load_age_distribution_data()
    # LSOA_neighbours = load_LSOA_neighbours_2021()

    # print(burglary_count.columns)
    # print(burglary_count.head())
    # print(burglary_count[burglary_count['crime_count'] == 0]['LSOA code'].count())
    # print(burglary_count.groupby('Date')['LSOA code'].nunique())
    # print('===============================================================')
    # print(economic_activity.columns)
    # print(economic_activity.head())
    # print('===============================================================')
    # print(societal_wellbeing.columns)
    # print(societal_wellbeing.head())
    # print('===============================================================')
    # print(population_density.columns)
    # print(population_density.head())
    # print('===============================================================')
    # print(age_distribution.columns)
    # print(age_distribution.head())
    # print('===============================================================')
    # print(LSOA_neighbours.columns)
    # print(LSOA_neighbours.head())
    # print('===============================================================')