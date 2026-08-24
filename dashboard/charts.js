function switchCharts(showLSOACharts = false) {
    wardChartsHolder = document.getElementById("wardCharts")
    lsoaChartsHolder = document.getElementById("lsoaCharts")

    if (wardChartsHolder && lsoaChartsHolder) {
        if (showLSOACharts) {
            wardChartsHolder.style.display = 'none'
            lsoaChartsHolder.style.display = 'block'
        } else {
            wardChartsHolder.style.display = 'block'
            lsoaChartsHolder.style.display = 'none'
        }
    }
}

function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}

function getLaggedData(code, data, year, month, num_lags = 6) {
    let final_data = []

    for (let i = 0; i < num_lags; i++) {
        if (month < 1) {
            year -= 1
            month = 12
        }

        let date = "" + year + "-" + pad(month)

        let row;
        if (data) {
            row = data.find(
                d => d["LSOA code"] === code && d.Date === date
            );
        }

        if (!data || !row) {
            row = { 'Date': date, 'crime_count': 0 }
        }

        final_data.push(row)

        month -= 1
    }

    return final_data.reverse()
}

function updateWardCharts(wardName, wardLSOAs) {
    // Update ward charts
    switchCharts(false)

    const resourceWChartCanvas = document.getElementById('resourceWChart');
    if (!resourceWChartCanvas) {
        console.warn("No canvas found for ward resource chart.");
        return;
    }

    const ctxResourceWChart = resourceWChartCanvas.getContext('2d');

    if (window.resourceWChart && typeof window.resourceWChart.destroy === 'function') {
        window.resourceWChart.destroy();
    }

    let resourceWChartLabels;
    let resourceWChartValues;
    if (wardLSOAs) {
        resourceWChartLabels = wardLSOAs.map(f => f.properties.lsoa21cd);
        resourceWChartValues = wardLSOAs.map(f => f.properties.allocation_hours.toFixed(1));
    } else {
        resourceWChartLabels = ['LSOA 1', 'LSOA 2', 'LSOA 3', 'LSOA 4'];
        resourceWChartValues = [0, 0, 0, 0];
    }

    window.resourceWChart = new Chart(ctxResourceWChart, {
        type: 'bar',
        data: {
            labels: resourceWChartLabels,
            datasets: [{
                label: 'Allocated Hours',
                data: resourceWChartValues,
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Resource Allocation for ${(!wardName || !wardLSOAs) ? "-Select Ward-" : wardName}`
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const lsoaCode = resourceWChartLabels[index];
                    const lsoa = lsoaCatalog.find(f => f.properties.lsoa21cd === lsoaCode);
                    if (lsoa) {
                        onLSOA(lsoa);
                    } else {
                        console.warn("LSOA not found:", lsoaCode);
                    }
                }
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
        }
    });

    const scoreWChartCanvas = document.getElementById('scoreWChart');
    if (!scoreWChartCanvas) {
        console.warn("No canvas found for ward score chart.");
        return;
    }

    const ctxScoreWChart = scoreWChartCanvas.getContext('2d');

    if (window.scoreWChart && typeof window.scoreWChart.destroy === 'function') {
        window.scoreWChart.destroy();
    }

    let scoreWChartLabels;
    let scoreWChartValues;
    if (wardLSOAs) {
        scoreWChartLabels = wardLSOAs.map(f => f.properties.lsoa21cd);
        scoreWChartValues = wardLSOAs.map(f => f.properties.risk_score.toFixed(1));
    } else {
        scoreWChartLabels = ['LSOA 1', 'LSOA 2', 'LSOA 3', 'LSOA 4'];
        scoreWChartValues = [0, 0, 0, 0];
    }

    window.scoreWChart = new Chart(ctxScoreWChart, {
        type: 'bar',
        data: {
            labels: scoreWChartLabels,
            datasets: [{
                label: 'Risk Score',
                data: scoreWChartValues,
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Risk Score for ${(!wardName || !wardLSOAs) ? "-Select Ward-" : wardName}`
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const lsoaCode = resourceWChartLabels[index];
                    const lsoa = lsoaCatalog.find(f => f.properties.lsoa21cd === lsoaCode);
                    if (lsoa) {
                        onLSOA(lsoa);
                    } else {
                        console.warn("LSOA not found:", lsoaCode);
                    }
                }
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
        }
    });
}

let isComparingLSOAs = false
let numberOfComparisons = 0

function updateLSOACharts(lsoaFeature, finalData, predictions = null) {
    // Update LSOA charts
    switchCharts(true)

    let LSOA_code
    LSOA_code = lsoaFeature ? lsoaFeature.properties.lsoa21cd : null
    let selectedYear = parseInt(document.getElementById('yearSelect').value, 10);
    let selectedMonth = parseInt(document.getElementById('monthSelect').value, 10);
    let selectedYearEnd = parseInt(document.getElementById('yearSelectEnd').value, 10);
    let selectedMonthEnd = parseInt(document.getElementById('monthSelectEnd').value, 10);
    let date = []
    let info;
    let matchingRows = [];

    while ((selectedYear < selectedYearEnd) || (selectedMonth <= selectedMonthEnd && selectedYear == selectedYearEnd)) {
        date.push("" + selectedYear + "-" + pad(selectedMonth))

        selectedMonth += 1
        if (selectedMonth > 12) {
            selectedMonth = 1
            selectedYear += 1
        }
    }

    if (finalData) {
        matchingRows = finalData.filter(d => d["LSOA code"] === LSOA_code && date.includes(d.Date));


        if (matchingRows.length > 0) {
            const sumFields = (field) => matchingRows.reduce((sum, d) => sum + parseFloat(d[field] || 0), 0);
            const avgFields = (field) => sumFields(field) / matchingRows.length;
            const avgPercentage = (numeratorField, denominatorField) => {
                return matchingRows.reduce((sum, d) => {
                    const denom = parseFloat(d[denominatorField] || 1);
                    const numer = parseFloat(d[numeratorField] || 0);
                    return sum + (denom > 0 ? (numer / denom) * 100 : 0);
                }, 0) / matchingRows.length;
            };

            info = {
                Education: avgFields("Education normalized"),
                Employment: avgFields("Employment normalized"),
                Environment: avgFields("Environment normalized"),
                Health: avgFields("Health normalized"),
                Housing: avgFields("Housing normalized"),
                IDACI: avgFields("IDACI normalized"),
                IDAOPI: avgFields("IDAOPI normalized"),
                IMD: avgFields("IMD normalized"),
                Income: avgFields("Income normalized"),
                Crime: avgFields("Crime normalized"),

                'Economically active: Employee: Full-time': avgFields('Economically active: Employee: Full-time normalized'),
                'Economically active: Employee: Part-time': avgFields('Economically active: Employee: Part-time normalized'),
                'Economically active: Full-time student': avgFields('Economically active: Full-time student normalized'),
                'Economically active: Self-employed with employees: Full-time': avgFields('Economically active: Self-employed with employees: Full-time normalized'),
                'Economically active: Self-employed with employees: Part-time': avgFields('Economically active: Self-employed with employees: Part-time normalized'),
                'Economically active: Self-employed without employees: Full-time': avgFields('Economically active: Self-employed without employees: Full-time normalized'),
                'Economically active: Self-employed without employees: Part-time': avgFields('Economically active: Self-employed without employees: Part-time normalized'),
                'Economically active: Unemployed': avgFields('Economically active: Unemployed normalized'),

                'Economically inactive:  Full-time students': avgFields('Economically inactive:  Full-time students normalized'),
                'Economically inactive: Other': avgFields('Economically inactive: Other normalized'),
                'Economically inactive: Long-term sick or disabled': avgFields('Economically inactive: Long-term sick or disabled normalized'),
                'Economically inactive: Looking after home or family': avgFields('Economically inactive: Looking after home or family normalized'),
                'Economically inactive: Retired': avgFields('Economically inactive: Retired normalized'),

                'Females 15-24 %': avgPercentage('Number F 15-24', 'Population'),
                'Females 25-34 %': avgPercentage('Number F 25-34', 'Population'),
                'Males 15-24 %': avgPercentage('Number M 15-24', 'Population'),
                'Males 25-34 %': avgPercentage('Number M 25-34', 'Population'),
                'Population': avgFields('Population'),
            };
        } else {
            info = null;
        }
    }

    const lineLSOAChartCanvas = document.getElementById('lineLSOAChart');
    if (!lineLSOAChartCanvas) {
        console.warn("Canvas with ID 'lineLSOAChart' not found.");
        return;
    }

    const ctxLineLSOAChart = lineLSOAChartCanvas.getContext('2d');

    if (window.lineLSOAChart && typeof window.lineLSOAChart.destroy === 'function') {
        window.lineLSOAChart.destroy();
    }

    let matchingDateRows = []

    if (finalData) {
        matchingDateRows = date.map(dt => {
            const row = finalData.find(d => d["LSOA code"] === LSOA_code && d.Date === dt);
            return {
                Date: dt,
                crime_count: row ? parseFloat(row['crime_count'] || 0) : 0
            };
        });
    }

    let predictionValue = null;

    if (predictions && predictions.length > 0 && LSOA_code) {
        const predictionRow = predictions.find(d => d['LSOA code'] === LSOA_code);
        if (predictionRow) {
            predictionValue = parseFloat(predictionRow['predicted_monthly_count'] || 0);
        }
    }


    let labels = matchingDateRows.map(row => row.Date);
    let values = matchingDateRows.map(row => row.crime_count);

    if (predictionValue !== null) {
        labels.push('2025-04');
    }

    if (predictionValue !== null) {
        values.push(predictionValue);
    }

    const pointStyles = Array(values.length).fill('circle');
    const pointRadii = Array(values.length).fill(4);

    if (predictionValue !== null) {
        pointStyles[pointStyles.length - 1] = 'cross';
        pointRadii[pointRadii.length - 1] = 8;
    }

    lineLSOAChart = new Chart(ctxLineLSOAChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: lsoaFeature ? lsoaFeature.properties.lsoa21nm : '',
                data: values,
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                tension: 0.3,
                fill: true,
                pointStyle: pointStyles,
                pointRadius: pointRadii,
                segment: {
                    borderDash: ctx => {
                        const index = ctx.p0DataIndex;
                        if (predictionValue !== null && index === values.length - 2) {
                            return [5, 5];
                        }
                        return undefined;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `LSOA crime count over time`
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const ctxDeprivationLSOAChart = document.getElementById('deprivationLSOAChart').getContext('2d');

    if (window.deprivationLSOAChart && typeof window.deprivationLSOAChart.destroy === 'function') {
        window.deprivationLSOAChart.destroy();
    }

    const deprivationLSOAChartLabels = ['Education', 'Employment', 'Environment', 'Health', 'Housing', 'IDACI', 'IDAOPI', 'IMD', 'Income', 'Crime'];
    const deprivationLSOAChartValues = [
        info ? info.Education : 0,
        info ? info.Employment : 0,
        info ? info.Environment : 0,
        info ? info.Health : 0,
        info ? info.Housing : 0,
        info ? info.IDACI : 0,
        info ? info.IDAOPI : 0,
        info ? info.IMD : 0,
        info ? info.Income : 0,
        info ? info.Crime : 0,
    ];

    window.deprivationLSOAChart = new Chart(ctxDeprivationLSOAChart, {
        type: 'radar',
        data: {
            labels: deprivationLSOAChartLabels,
            datasets: [{
                label: lsoaFeature ? lsoaFeature.properties.lsoa21nm : "-Selecet LSOA-",
                data: deprivationLSOAChartValues,
                fill: true,
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderColor: 'rgba(220, 53, 69, 1)',
                pointBackgroundColor: 'rgba(220, 53, 69, 1)'
            }]
        },
        options: {
            responsive: true,
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Mean Indices of Deprivation`
                }
            },
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });

    const ctxEconomicallyActiveLSOAChart = document.getElementById('economicallyActiveLSOAChart').getContext('2d');

    if (window.economicallyActiveLSOAChart && typeof window.economicallyActiveLSOAChart.destroy === 'function') {
        window.economicallyActiveLSOAChart.destroy();
    }

    const economicallyActiveLSOAChartLabels = [
        ['Full-time', 'employee'],
        ['Part-time', 'employee'],
        ['Full-time', 'student'],
        ['Self-employed', 'w employees'],
        ['Self-employed', 'w/o employees'],
        ['Unemployed']
    ];
    const economicallyActiveLSOAChartValues = [
        info ? info['Economically active: Employee: Full-time'] : 0,
        info ? info['Economically active: Employee: Part-time'] : 0,
        info ? info['Economically active: Full-time student'] : 0,
        info ? parseInt(info['Economically active: Self-employed with employees: Full-time']) + parseInt(info['Economically active: Self-employed with employees: Part-time']) : 0,
        info ? parseInt(info['Economically active: Self-employed without employees: Full-time']) + parseInt(info['Economically active: Self-employed without employees: Part-time']) : 0,
        info ? info['Economically active: Unemployed'] : 0,
    ];

    window.economicallyActiveLSOAChart = new Chart(ctxEconomicallyActiveLSOAChart, {
        type: 'radar',
        data: {
            labels: economicallyActiveLSOAChartLabels,
            datasets: [{
                label: lsoaFeature ? lsoaFeature.properties.lsoa21nm : "-Selecet LSOA-",
                data: economicallyActiveLSOAChartValues,
                fill: true,
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderColor: 'rgba(220, 53, 69, 1)',
                pointBackgroundColor: 'rgba(220, 53, 69, 1)'
            }]
        },
        options: {
            responsive: true,
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Mean Number of Economically Active`
                }
            },
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });

    const ctxEconomicallyInactiveLSOAChart = document.getElementById('economicallyInactiveLSOAChart').getContext('2d');

    if (window.economicallyInactiveLSOAChart && typeof window.economicallyInactiveLSOAChart.destroy === 'function') {
        window.economicallyInactiveLSOAChart.destroy();
    }

    const economicallyInactiveLSOAChartLabels = [
        ['Full-time', 'students'],
        ['Other'],
        ['Long-term sick', 'or disabled'],
        ['Looking after', 'home/family'],
        ['Retired']
    ];
    const economicallyInactiveLSOAChartValues = [
        info ? info['Economically inactive:  Full-time students'] : 0,
        info ? info['Economically inactive: Other'] : 0,
        info ? info['Economically inactive: Long-term sick or disabled'] : 0,
        info ? info['Economically inactive: Looking after home or family'] : 0,
        info ? info['Economically inactive: Retired'] : 0,
    ];

    window.economicallyInactiveLSOAChart = new Chart(ctxEconomicallyInactiveLSOAChart, {
        type: 'radar',
        data: {
            labels: economicallyInactiveLSOAChartLabels,
            datasets: [{
                label: lsoaFeature ? lsoaFeature.properties.lsoa21nm : "-Selecet LSOA-",
                data: economicallyInactiveLSOAChartValues,
                fill: true,
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderColor: 'rgba(220, 53, 69, 1)',
                pointBackgroundColor: 'rgba(220, 53, 69, 1)'
            }]
        },
        options: {
            responsive: true,
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Mean Number of Economically Inactive`
                }
            },
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });

    const ageDistributionLSOAChartCanvas = document.getElementById('ageDistributionLSOAChart');
    if (!ageDistributionLSOAChartCanvas) {
        console.warn("No canvas found for LSOA age distribution chart.");
        return;
    }

    const ctxAgeDistributionLSOAChart = ageDistributionLSOAChartCanvas.getContext('2d');

    if (window.ageDistributionLSOAChart && typeof window.ageDistributionLSOAChart.destroy === 'function') {
        window.ageDistributionLSOAChart.destroy();
    }

    const ageDistributionLSOAChartLabels = ['Females 15-24', 'Females 25-34', 'Males 15-24', 'Males 25-34'];
    const ageDistributionLSOAChartValues = [
        info ? info['Females 15-24 %'] : 0,
        info ? info['Females 25-34 %'] : 0,
        info ? info['Males 15-24 %'] : 0,
        info ? info['Males 25-34 %'] : 0,
    ];

    window.ageDistributionLSOAChart = new Chart(ctxAgeDistributionLSOAChart, {
        type: 'bar',
        data: {
            labels: ageDistributionLSOAChartLabels,
            datasets: [{
                label: lsoaFeature ? lsoaFeature.properties.lsoa21nm : "-Selecet LSOA-",
                data: ageDistributionLSOAChartValues,
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Mean Age Distribution (in %)`
                }
            }
        }
    });
}

const colorTheme = [
    { 'red': 0, 'green': 123, 'blue': 255 },
    { 'red': 40, 'green': 167, 'blue': 69 },
    { 'red': 111, 'green': 66, 'blue': 193 },
    { 'red': 255, 'green': 159, 'blue': 64 },
]

async function compareWithSecondLSOA(secondLsoaFeature, predictions = null) {
    if (!colorTheme[numberOfComparisons]) {
        await Swal.fire({ title: `You can compare up to ${colorTheme.length + 1} LSOAs.`, icon: 'error', confirmButtonText: 'OK' });
        return null;
    }

    let curr_color = colorTheme[numberOfComparisons];
    numberOfComparisons += 1;

    const LSOA_code = secondLsoaFeature.properties.lsoa21cd;

    let selectedYear = parseInt(document.getElementById('yearSelect').value, 10);
    let selectedMonth = parseInt(document.getElementById('monthSelect').value, 10);
    let selectedYearEnd = parseInt(document.getElementById('yearSelectEnd').value, 10);
    let selectedMonthEnd = parseInt(document.getElementById('monthSelectEnd').value, 10);

    let date = [];
    while ((selectedYear < selectedYearEnd) || (selectedMonth <= selectedMonthEnd && selectedYear === selectedYearEnd)) {
        date.push("" + selectedYear + "-" + pad(selectedMonth));
        selectedMonth += 1;
        if (selectedMonth > 12) {
            selectedMonth = 1;
            selectedYear += 1;
        }
    }

    const matchingRows = finalData.filter(d => d["LSOA code"] === LSOA_code && date.includes(d.Date));

    if (matchingRows.length === 0) {
        Swal.fire("Data not found", "No data available for selected LSOA/date range.", "error");
        return;
    }

    const sumFields = (field) => matchingRows.reduce((sum, d) => sum + parseFloat(d[field] || 0), 0);
    const avgFields = (field) => sumFields(field) / matchingRows.length;
    const avgPercentage = (numeratorField, denominatorField) => {
        return matchingRows.reduce((sum, d) => {
            const denom = parseFloat(d[denominatorField] || 1);
            const numer = parseFloat(d[numeratorField] || 0);
            return sum + (denom > 0 ? (numer / denom) * 100 : 0);
        }, 0) / matchingRows.length;
    };

    const info = {
        Education: avgFields("Education normalized"),
        Employment: avgFields("Employment normalized"),
        Environment: avgFields("Environment normalized"),
        Health: avgFields("Health normalized"),
        Housing: avgFields("Housing normalized"),
        IDACI: avgFields("IDACI normalized"),
        IDAOPI: avgFields("IDAOPI normalized"),
        IMD: avgFields("IMD normalized"),
        Income: avgFields("Income normalized"),
        Crime: avgFields("Crime normalized"),

        'Economically active: Employee: Full-time': avgFields('Economically active: Employee: Full-time normalized'),
        'Economically active: Employee: Part-time': avgFields('Economically active: Employee: Part-time normalized'),
        'Economically active: Full-time student': avgFields('Economically active: Full-time student normalized'),
        'Economically active: Self-employed with employees: Full-time': avgFields('Economically active: Self-employed with employees: Full-time normalized'),
        'Economically active: Self-employed with employees: Part-time': avgFields('Economically active: Self-employed with employees: Part-time normalized'),
        'Economically active: Self-employed without employees: Full-time': avgFields('Economically active: Self-employed without employees: Full-time normalized'),
        'Economically active: Self-employed without employees: Part-time': avgFields('Economically active: Self-employed without employees: Part-time normalized'),
        'Economically active: Unemployed': avgFields('Economically active: Unemployed normalized'),

        'Economically inactive:  Full-time students': avgFields('Economically inactive:  Full-time students normalized'),
        'Economically inactive: Other': avgFields('Economically inactive: Other normalized'),
        'Economically inactive: Long-term sick or disabled': avgFields('Economically inactive: Long-term sick or disabled normalized'),
        'Economically inactive: Looking after home or family': avgFields('Economically inactive: Looking after home or family normalized'),
        'Economically inactive: Retired': avgFields('Economically inactive: Retired normalized'),

        'Females 15-24 %': avgPercentage('Number F 15-24', 'Population'),
        'Females 25-34 %': avgPercentage('Number F 25-34', 'Population'),
        'Males 15-24 %': avgPercentage('Number M 15-24', 'Population'),
        'Males 25-34 %': avgPercentage('Number M 25-34', 'Population'),
        'Population': avgFields('Population'),
    };

    const secondLabel = secondLsoaFeature.properties.lsoa21nm || "Another LSOA";

    const chartsToUpdate = [
        {
            chart: window.deprivationLSOAChart, values: [
                info.Education, info.Employment, info.Environment,
                info.Health, info.Housing, info.IDACI, info.IDAOPI,
                info.IMD, info.Income, info.Crime
            ]
        },
        {
            chart: window.economicallyActiveLSOAChart, values: [
                info['Economically active: Employee: Full-time'],
                info['Economically active: Employee: Part-time'],
                info['Economically active: Full-time student'],
                parseInt(info['Economically active: Self-employed with employees: Full-time']) + parseInt(info['Economically active: Self-employed with employees: Part-time']),
                parseInt(info['Economically active: Self-employed without employees: Full-time']) + parseInt(info['Economically active: Self-employed without employees: Part-time']),
                info['Economically active: Unemployed']
            ]
        },
        {
            chart: window.economicallyInactiveLSOAChart, values: [
                info['Economically inactive:  Full-time students'],
                info['Economically inactive: Other'],
                info['Economically inactive: Long-term sick or disabled'],
                info['Economically inactive: Looking after home or family'],
                info['Economically inactive: Retired']
            ]
        },
        {
            chart: window.ageDistributionLSOAChart, values: [
                info['Females 15-24 %'],
                info['Females 25-34 %'],
                info['Males 15-24 %'],
                info['Males 25-34 %']
            ]
        }
    ];

    chartsToUpdate.forEach(({ chart, values }) => {
        chart.data.datasets.push({
            label: secondLabel,
            data: values,
            fill: chart.config.type === 'radar',
            backgroundColor: chart.config.type === 'radar'
                ? `rgba(${curr_color.red}, ${curr_color.green}, ${curr_color.blue}, 0.2)`
                : `rgba(${curr_color.red}, ${curr_color.green}, ${curr_color.blue}, 0.6)`,
            borderColor: `rgba(${curr_color.red}, ${curr_color.green}, ${curr_color.blue}, 1)`,
            pointBackgroundColor: `rgba(${curr_color.red}, ${curr_color.green}, ${curr_color.blue}, 1)`
        });
        chart.update();
    });

    let matchingDateRows = date.map(dt => {
        const row = finalData.find(d => d["LSOA code"] === LSOA_code && d.Date === dt);
        return {
            Date: dt,
            crime_count: row ? parseFloat(row['crime_count'] || 0) : 0
        };
    });

    let predictionValue = null;
    if (predictions && predictions.length > 0 && LSOA_code) {
        const predictionRow = predictions.find(d => d['LSOA code'] === LSOA_code);
        if (predictionRow) {
            predictionValue = parseFloat(predictionRow['predicted_monthly_count'] || 0);
        }
    }

    const fullValues = matchingDateRows.map(row => row.crime_count);

    let pointStyles = Array(fullValues.length).fill('circle');
    let pointRadii = Array(fullValues.length).fill(4);
    if (predictionValue !== null) {
        fullValues.push(predictionValue);
        pointStyles.push('cross');
        pointRadii.push(8);
    }
    if (window.lineLSOAChart) {
        window.lineLSOAChart.data.datasets.push({
            label: secondLabel,
            data: fullValues,
            borderColor: `rgba(${curr_color.red}, ${curr_color.green}, ${curr_color.blue}, 1)`,
            backgroundColor: `rgba(${curr_color.red}, ${curr_color.green}, ${curr_color.blue}, 0.2)`,
            tension: 0.3,
            fill: true,
            pointStyle: pointStyles,
            pointRadius: pointRadii,
            segment: {
                borderDash: ctx => {
                    const index = ctx.p0DataIndex;
                    if (predictionValue !== null && index === fullValues.length - 2) {
                        return [5, 5];
                    }
                    return undefined;
                }
            }
        });
        window.lineLSOAChart.update();
    }
}