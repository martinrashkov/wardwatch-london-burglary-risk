# Data-Challenge-2

## Environment setup instructions
We recommend setting up a virtual Python environment to install the package and its dependencies. To install the package, we recommend to execute `pip install -r requirements.txt` in the command line. This will install it in editable mode, meaning there is no need to reinstall after making changes. If you are using PyCharm, it should offer you the option to create a virtual environment from the requirements file on startup. Note that also in this case, it will still be necessary to run the pip command described above.

## Data description

To load the data, extract the data.zip file from `https://drive.google.com/file/d/1p88hiWi-KT5R4CSIMD5GwcG1eRDlEHmZ/view?usp=drive_link`. Unzip the data folder and place it in the main `Data-Challenge-2` folder. You should have the following datasets:
-`Data-Challenge-2/data/metropolitan-burglary-combined.csv`
-`Data-Challenge-2/data/societal-wellbeing-combined.csv`
-`Data-Challenge-2/data/economic-activity-combined.csv`
-`Data-Challenge-2/data/burglary-count.csv`
-`Data-Challenge-2/data/final-data-2022.csv`

To load the data, run `data_loader.load_final_data_2022()`. This function will return a dataframe containing the number of crimes for each LSOA for each month from January 2022 to February 2025. It also contains the last recorded societal wellbeing and economic activity data. 

### Dataset Column Description

| Column name | Description | Dataset |
|-------------|-------------|---------|
| LSOA code | Lower Layer Super Output Area code |  |
| Date | The year and month of the record in the format 'yyyy-mm' |  |
| crime_count | Number of burglaries for that LSOA code and Date |  |
| Falls_within | Unknown column, possibly spatial relation |  |
| LSOA_name | Name of the LSOA |  |
| Year | Year extracted from the 'Date' |  |
| Month | Month extracted from the 'Date' |  |
| Neighbour LSOA codes | List of neighbouring LSOA codes |  |
| number_neighbours | Number of neighbouring LSOAs |  |
| avg_neighbour_crime_count | Average crime count in neighbouring LSOAs |  |
| local authority code | Code for the local authority |  |
| local authority name | Name of the local authority |  |
| All usual residents aged 16 or over | Population aged 16 or over |  |
| Economically active: Employee: Full-time | Economically active residents working full-time |  |
| Economically active: Employee: Part-time | Economically active residents working part-time |  |
| Economically active: Full-time student | Full-time students who are economically active |  |
| Economically active: Self-employed with employees: Full-time | Self-employed with employees (full-time) |  |
| Economically active: Self-employed with employees: Part-time | Self-employed with employees (part-time) |  |
| Economically active: Self-employed without employees: Full-time | Self-employed without employees (full-time) |  |
| Economically active: Self-employed without employees: Part-time | Self-employed without employees (part-time) |  |
| Economically active: Unemployed | Residents who are unemployed |  |
| Economically inactive: Long-term sick or disabled | Economically inactive due to long-term illness or disability |  |
| Economically inactive: Looking after home or family | Economically inactive due to family care |  |
| Economically inactive: Other | Economically inactive due to other reasons |  |
| Economically inactive: Retired | Economically inactive due to retirement |  |
| Economically inactive:  Full-time students | Economically inactive full-time students |  |
| Crime | Crime Domain Score | wellbeing |
| Education | Education, Skills and Training Domain Score | wellbeing |
| Employment | Employment Deprivation Domain Score | wellbeing |
| Environment | Living Environment Deprivation Domain Score | wellbeing |
| Health | Health Deprivation and Disability Domain Score | wellbeing |
| Housing | Barriers to Housing and Services Domain Score | wellbeing |
| IDACI | Income Deprivation Affecting Children Index | wellbeing |
| IDAOPI | Income Deprivation Affecting Older People Index | wellbeing |
| IMD | Index of Multiple Deprivation | wellbeing |
| Income | Income score | wellbeing |
| Area | Area of the LSOA (in km²) |  |
| Population | Population of the LSOA |  |
| Density | Population density (people per square km) |  |
| Number M 15-24 | Number of males aged 15–24 |  |
| Number M 25-34 | Number of males aged 25–34 |  |
| Number F 15-24 | Number of females aged 15–24 |  |
| Number F 25-34 | Number of females aged 25–34 |  |


<!-- ### Crime

The data, that can be loaded with `data_loader.load_crime_data()` contains the combined data for all burglaries that happened between December of 2010 and February 2025 (both months are included). The data is extracted from the following archive: `https://data.police.uk/data/archive/`. The only column changes are that the columns `Month` was renamed to `Date` (since it had the format `yyyy-mm`) and the following numerical columns were added: `Month` and `Year`.

### Societal wellbeing

The data, that can be loaded with `data_loader.load_societal_wellbeing_data()` contains the combined data for all societal wellbeing data for 2010, 2015 and 2019. The data is extracted from the following archive: `https://opendatacommunities.org/def/concept/folders/themes/societal-wellbeing`. The data contains the `LSOA code` and `Year` columns from the original data. The other columns are the score value of the corresponding indices: `Crime`, `Education`, `Employment`, `Environment`, `Health`, `Housing`, `IDACI` (Income Deprivation Affecting Children Index), `IDAOPI` (Income Deprivation Affecting Older People Index) and `Income`. The columns `IDACI` and `IDAOPI` have the value `NaN` for the year 2010.

### Economic activity

The data, that can be loaded with `data_loader.load_economic_activity_data()` contains the combined data for 2011 and 2021 for the number of economically active and inactive members of society per LSOA.

## Loading the data

### Processed

You can download the processed data from `https://drive.google.com/file/d/1p88hiWi-KT5R4CSIMD5GwcG1eRDlEHmZ/view?usp=drive_link`. Unzip the data folder and place it in the main `Data-Challenge-2` folder. You should have the following datasets:
-`Data-Challenge-2/data/metropolitan-burglary-combined.csv` (loaded with `data_loader.load_crime_data()`)
-`Data-Challenge-2/data/societal-wellbeing-combined.csv` (loaded with `data_loader.load_societal_wellbeing_data()`)
-`Data-Challenge-2/data/economic-activity-combined.csv` (loaded with `data_loader.load_economic_activity_data()`)

### Unprocessed

Focus on the following process only if you wish to reproduce the above-mentioned datasets.

- To reproduce the crime dataset, download the archived data from 'https://data.police.uk/data/archive/'. Each archive contains multiple months. Ensure that you have all data from December of 2010 and February 2025 included (if you miss any months, a message will be printed in the console). Extract the archives. Each archive contains multiple folders (for each month in the archive). Paste those folders in `Data-Challenge-2/raw data/crime`. If you have the `Data-Challenge-2/data/metropolitan-burglary-combined.csv` dataset, run `data_loader.crime_combine_data()`. If you are missing the already processed data, the function `data_loader.load_crime_data()` will automatically compute and save the data.

- To reproduce the societal wellbeing dataset, download the following datasets from `https://opendatacommunities.org/def/concept/folders/themes/societal-wellbeing`:
    -`English Indices of Deprivation 2015 - LSOA Level`
    -`English Indices of Deprivation 2019 - LSOA Level`
    -`Index of Multiple Deprivation Score, 2010`
    -`Indices of Multiple Deprivation 2010, Crime Score`
    -`Indices of Multiple Deprivation 2010, Education Score`
    -`Indices of Multiple Deprivation 2010, Employment Score`
    -`Indices of Multiple Deprivation 2010, Environment Score`
    -`Indices of Multiple Deprivation 2010, Health Score`
    -`Indices of Multiple Deprivation 2010, Housing Score`
    -`Indices of Multiple Deprivation 2010, Income Score`
    Put those datasets in the folder `Data-Challenge-2/raw data/societal wellbeing`. Ensure that the variables in the `Data-Challenge-2/config.py` file are the correct file names. If you have the `Data-Challenge-2/data/societal-wellbeing-combined.csv` dataset, run `data_loader.societal_wellbeing_combine_data()`. If you are missing the already processed data, the function `data_loader.load_societal_wellbeing_data()` will automatically compute and save the data.

- To reproduce the economic activity dataset, download the xlsx dataset from here: `https://docs.google.com/spreadsheets/d/1m3WwInqsQfnamvkKESMB50gyXgNiON-n/edit?usp=drive_link&ouid=106666082464535737806&rtpof=true&sd=true`. Put it in the folder `Data-Challenge-2/raw data/other`. If you have the `Data-Challenge-2/data/economic-activity-combined.csv` dataset, run `data_loader.economic_activity_combine_data()`. If you are missing the already processed data, the function `data_loader.load_economic_activity_data()` will automatically compute and save the data. -->