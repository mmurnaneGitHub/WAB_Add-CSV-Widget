define({
  root: ({
    settingsHeader : "Set the details for the GeoLookup Widget",
    settingsDesc : "Geo-enrich a list of locations from a CSV file against polygon layers on the map. Selected fields from polygon layers are appended to the locations.",
    settingsLoadingLayers: "Please wait while layers are loading.",
    settingsConfigureTitle: "Configure Layer Fields",
    layerTable : {
      colEnrich : "Enrich",
      colLabel : "Layer",
      colFieldSelector : "Fields"
    },
    fieldTable : {
      colAppend : "Append",
      colName : "Name",
      colAlias : "Alias",
      colOrder : "Actions",
      label : "Check the fields you want to append. Select a field to update its alias and order."
    },
    symbolArea : {
      symbolLabelWithin : 'Select the symbol for locations within:',
      symbolLabelOutside : 'Select the symbol for locations outside:'
    },
    advSettings : {
      label: "Advanced Settings", 
      latFieldsDesc : "Possible field names for Latitude field.",
      longFieldsDesc : "Possible field names for Longitude field.",
      intersectFieldDesc : "The name of the field created to store value if lookup intersected a layer.",
      intersectInDesc : "Value to store when location intersected a polygon.",
      intersectOutDesc : "Value to store when location did not intersect a polygon.",
      maxRowCount : "Maximum number of rows in CSV file.",
      cacheNumberDesc : "Point cluster threshold for faster processing.",
      subTitle : "Set values for CSV file."
    },
    noPolygonLayers : "No Polygon Layers",
    errorOnOk : "Please fill out all parameters before saving config",
    saveFields : "Save Fields",
    cancelFields : "Cancel Fields",
    saveAdv : "Save Adv. Settings",
    cancelAdv : "Cancel Adv. Settings",
    advSettingsBtn : "Advanced Settings",
    chooseSymbol: "Choose a Symbol",
    okBtn: "OK",
    cancelBtn: "Cancel"
  }),
  "ar": 1,
  "cs": 1,
  "da": 1,
  "de": 1,
  "el": 1,
  "es": 1,
  "et": 1,
  "fi": 1,
  "fr": 1,
  "he": 1,
  "it": 1,
  "ja": 1,
  "ko": 1,
  "lt": 1,
  "lv": 1,
  "nb": 1,
  "nl": 1,
  "pl": 1,
  "pt-br": 1,
  "pt-pt": 1,
  "ro": 1,
  "ru": 1,
  "sv": 1,
  "th": 1,
  "tr": 1,
  "vi": 1,
  "zh-cn": 1,
  "zh-hk": 1,
  "zh-tw": 1
});
