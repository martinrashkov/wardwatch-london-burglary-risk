import pandas as pd
import numpy as np

import data_loader
import EDA
import config

def compute_consecutive_streaks(df, cutoff_value):
    df = df.sort_values(by=['LSOA code', 'Year', 'Month'])

    streaks = []

    for lsoa, group in df.groupby('LSOA code'):
        current_streak = 0

        for value in group['crime_count_diff']:
            if value > cutoff_value:
                current_streak += 1
            else:
                streaks.append(current_streak)
                current_streak = 0

        streaks.append(current_streak)

    return streaks

if __name__ == "__main__":
    df = data_loader.load_final_data_2022()

    print('Final Data:')
    print(df.columns)
    # print(df.head())
    # print(df[['LSOA code', 'Neighbour LSOA codes', 'number_neighbours', 'avg_neighbour_crime_count']].head())
    print(df.loc[:, ['crime_count', 'number_neighbours', 'avg_neighbour_crime_count',
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
       'Economically inactive:  Full-time students', 'Crime', 'Education',
       'Employment', 'Environment', 'Health', 'Housing', 'IDACI', 'IDAOPI',
       'IMD', 'Income', 'Area', 'Population', 'Density', 'Number M 15-24',
       'Number M 25-34', 'Number F 15-24', 'Number F 25-34']].describe().T)
    print('===============================================================')