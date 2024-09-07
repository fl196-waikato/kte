require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/ImageryLayer",
    "esri/widgets/BasemapGallery",
    "esri/widgets/LayerList",
    "esri/widgets/Legend"
], function(Map, MapView, ImageryLayer, BasemapGallery, LayerList, Legend) {

    console.log('Require callback executed');

    var lastStoredLocation = null; // 用于记录最后一次存储的位置
    var locationThreshold = 0.05; // 定义位置变化的阈值，单位为度（大约5公里）
    var timeThreshold = 5000; // 定义时间间隔为5秒

    var lastStoreTime = 0; // 上一次存储的时间戳

    function shouldStoreLocation(newLocation) {
        var currentTime = new Date().getTime();

        // 检查时间间隔
        if (currentTime - lastStoreTime < timeThreshold) {
            return false;
        }

        // 检查位置变化是否超过阈值
        if (lastStoredLocation) {
            var distance = Math.sqrt(
                Math.pow(newLocation[0] - lastStoredLocation[0], 2) +
                Math.pow(newLocation[1] - lastStoredLocation[1], 2)
            );
            if (distance < locationThreshold) {
                return false;
            }
        }

        // 如果通过以上检查，则允许存储
        lastStoredLocation = newLocation;
        lastStoreTime = currentTime;
        return true;
    }

    const Auth = Amplify.Auth;

    async function getUserInfo() {
        try {
            const user = await Auth.currentAuthenticatedUser();
            const userId = user.attributes.sub;  // 获取用户ID
            return userId;
        } catch (error) {
            console.error('Error fetching user info: ', error);
            return null;
        }
    }

// Function to collect user behavior data
    async function collectUserData(mapType) {
        const userId = await getUserInfo();  // 获取用户ID
        if (!userId) {
            console.error('User is not authenticated.');
            return;
        }

        const userData = {
            user_id: userId,
            query_time: new Date().toISOString(),
            query_location: view.center.toArray().join(','), // 将数组转换为字符串
            map_type: basemap
        };

        try {
            const session = await Auth.currentSession();
            const token = session.getIdToken().getJwtToken();

            // Send data to AWS Lambda
            const response = await fetch('https://eu34h9i8yd.execute-api.us-east-1.amazonaws.com/dev/collectUserData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            console.log('Success:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

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


    console.log('Basemap:', map.basemap);
    console.log('Type of Basemap:', typeof map.basemap);
    // Call the function to collect user data on initial load
    collectUserData(map.basemap);

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

    // Event listener for basemap change
    basemapGallery.watch('activeBasemap', function(newValue) {
        collectUserData(newValue);  // Collect data whenever basemap is changed
    });

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
});  // End of require bloc
