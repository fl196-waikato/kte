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
        url: "https://services.arcgisonline.com/arcgis/rest/services/Sentinel2_Imagery/MapServer",
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
  
  });
  