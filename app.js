require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/ImageryLayer",
    "esri/widgets/BasemapGallery",
    "esri/widgets/LayerList",
    "esri/widgets/Legend"
], function(Map, MapView, ImageryLayer, BasemapGallery, LayerList, Legend) {

    // Create the map
    var map = new Map({
        basemap: "streets"  // initial basemap
    });

    // Create the view
    var view = new MapView({
        container: "map",
        map: map,
        center: [0, 0], // longitude, latitude
        zoom: 2
    });

    // Sentinel-2 ImageryLayer
    var sentinelLayer = new ImageryLayer({
        url: "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer",
        title: "Sentinel-2 Imagery"
    });

    // Add the Sentinel-2 Layer to the map
    map.add(sentinelLayer);

    // Add BasemapGallery widget to allow switching basemaps
    var basemapGallery = new BasemapGallery({
        view: view
    });
    view.ui.add(basemapGallery, "top-right");

    // Add LayerList widget to toggle layers
    var layerList = new LayerList({
        view: view
    });
    view.ui.add(layerList, "bottom-right");

    // Add Legend widget
    var legend = new Legend({
        view: view
    });
    view.ui.add(legend, "bottom-left");

    // Load and parse the CSV file using PapaParse
    Papa.parse("treecover.csv", {
        download: true,
        header: true,
        complete: function(results) {
            console.log(results.data);  // Check the parsed data
            var brazilData = [];
            var indonesiaData = [];
            var congoData = [];
            var years = [];
            
            results.data.forEach(function(row) {
                if(row['iso'] === 'BRA') {
                    brazilData.push(parseFloat(row['umd_tree_cover_loss_from_fires__ha']) / 1000000);
                }
                if(row['iso'] === 'IDN') {
                    indonesiaData.push(parseFloat(row['umd_tree_cover_loss_from_fires__ha']) / 1000000);
                }
                if(row['iso'] === 'COD') {
                    congoData.push(parseFloat(row['umd_tree_cover_loss_from_fires__ha']) / 1000000);
                }
                if(!years.includes(row['umd_tree_cover_loss__year'])) {
                    years.push(row['umd_tree_cover_loss__year']);
                }
            });

    
            // Continue with chart setup
            var ctx = document.getElementById('sentinelChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: 'BRA',
                            data: brazilData,
                            backgroundColor: 'rgba(50, 205, 50, 0.2)',
                            borderColor: 'rgba(50, 205, 50, 1)',
                            borderWidth: 1,
                            fill: true,
                            tension: 0.1
                        },
                        {
                            label: 'IDN',
                            data: indonesiaData,
                            backgroundColor: 'rgba(255, 69, 0, 0.2)',
                            borderColor: 'rgba(255, 69, 0, 1)',
                            borderWidth: 1,
                            fill: true,
                            tension: 0.1
                        },
                        {
                            label: 'COD',
                            data: congoData,
                            backgroundColor: 'rgba(255, 182, 193, 0.2)',
                            borderColor: 'rgba(255, 182, 193, 1)',
                            borderWidth: 1,
                            fill: true,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Hectares Lost (Millions)'
                            }
                        }
                    }
                }
            });
        }
    });
});  // End of require block
