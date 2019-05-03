///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//City of Tacoma, Community and Economic Development, GIS Analysis and Data Services
//NOTES...SB
//widget is operational with these lines removed, 20160711_202...SB
//only button on the panel is the clear button that works.
//drag and drop is still functional for csv and then posting points on the map
//removed a lot of code today 20160711_446
//
//next need to work on the messages that are returned...
//also need to get more information from mike on how/what I need to do in the config.js part
//
//ended on function in orange below.....is operational at this point....SB
//
//7/25/16
//addressed remaining errors that were present upon running the csv tool
//tool is operational at this point
//
//latitude and longitude header types are located in the following folder/file:
//C:\arcgis-web-appbuilder-2.0\WebAppBuilderForArcGIS\server\apps\2\widgets\AddCSV\config.json
//Modified by MJM on 4/17/2017 to add geocoding - see test files: \\Geobase-win\CED\GADS\R2017\R122\geocode
/////////////////////////////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidget',
        'dojo/dom',
        'dojo/on',
        'dojo/sniff',
        'dojo/_base/html',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/string',
        'dojo/dom-class',
        'dojo/dom-style',
        'dojox/data/CsvStore',
        'esri/geometry/webMercatorUtils',
        'esri/layers/FeatureLayer',
        'esri/geometry/Multipoint',
        'esri/geometry/Point',
        'esri/InfoTemplate',
        'esri/tasks/QueryTask',
        'esri/SpatialReference',
        'esri/symbols/jsonUtils',
        'esri/renderers/SimpleRenderer',
        'jimu/dijit/Message',
        'jimu/utils'],
function(declare,
        _WidgetsInTemplateMixin,
        BaseWidget,
        dom,
        on,
        has,
        html,
        lang,
        array,
        string,
        domClass,
        domStyle,
        CsvStore,
        webMercatorUtils,
        FeatureLayer,
        Multipoint,
        Point,
        InfoTemplate,
        QueryTask,
        SpatialReference,
        symbolJsonUtils,
        SimpleRenderer,
        Message,
        utils) {

  return declare([BaseWidget, _WidgetsInTemplateMixin], {

    baseClass : 'solutions-widget-geolookup',
    csvStore : null,
    layerLoaded : false,
    lookupLayersFieldNames : [],
    lookupLayersFields : [],
    combinedFields : [],
    latField : null,
    longField : null,
    renderer : null,
    srWebMerc : null,
    syncLayers : null,
    enrichFilter : null,
    enrichResultsProg : {},
    enrichResultsText : {},
    errorList : null,
    
    startup : function() {
      this.inherited(arguments);
      this._buildRenderer();
      if (utils.file.supportHTML5()) {
        var c = dom.byId(this.id);
        this.own(on(c, 'dragover', function(event) {
          event.preventDefault();
        }));

        this.own(on(c, 'dragenter', function(event) {
          event.preventDefault();
        }));

        this.own(on(c, 'drop', lang.hitch(this, this._handleCSVDrop)));
      }
      this.srWebMerc = new SpatialReference({
        wkid : 102100
      });

      if (!utils.file.supportHTML5() && !has('safari') && utils.file.isEnabledFlash()) {
        utils.file.loadFileAPI().then(lang.hitch(this, function() {
          console.log('loading FileAPI');
        }));
      } else {
      }
    },
    
    _buildRenderer : function() {
      //MJM change default symbol
      //this.symIn = symbolJsonUtils.fromJson(this.config.SymbolWithin);
      //this.symOut = symbolJsonUtils.fromJson(this.config.SymbolOutside);
      //START HERE
      // https://developers.arcgis.com/javascript/3/jsapi/simplerenderer-amd.html 
      var simpleJson =  {
        "type": "simple",
        "symbol": {
          "type": "esriPMS",
          "url": "https://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
          "imageData": "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",
          "contentType": "image/png",
          "width": 15,
          "height": 15
        }
      };
        this.renderer = new SimpleRenderer(simpleJson);

    },
    _handleCSVDrop : function(event) {
      event.preventDefault();
      var dataTransfer = event.dataTransfer;
      this._processFiles(dataTransfer.files);
    },
    _processFiles : function(files) {
      if (files.length > 0) {
        var file = files[0];
        if (file.name.indexOf('.csv') !== -1) {
          if (file) {
            this.handleCSV(file);
          } else {

            Message({
              message : this.nls.error.fileIssue

            });
            domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
            this.clearCSVResults();
          }
        } else {
          new Message({
            message : this.nls.error.notCSVFile
          });
        
          domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
          this.clearCSVResults();
        }
      }
    },
    showFileDialog : function() {
      if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled')) {
        return;
      };
    },
    handleCSV : function(file) {
      if (utils.file.supportHTML5()) {
        var reader = new FileReader();
        reader.onload = lang.hitch(this, function() {
          this._processCSVData(reader.result);
        });
        reader.readAsText(file);
      } else {
        window.FileAPI.readAsText(file, lang.hitch(this, function (evt) {
          if (evt.type === 'load') {
            this._processCSVData(evt.result);
          }
        }));
      }
    },

    _processCSVData : function(data) {
      if(data.length > 2) {
        var newLineIndex = data.indexOf('\n');
        var firstLine = lang.trim(data.substr(0, newLineIndex));
        var remainder = data.replace(firstLine,'');
        if (firstLine !== '' && remainder.length > 2) { //2 to handle CSV with no record. just header. factory note.
          console.log(newLineIndex);
          var separator = this._getSeparator(firstLine);
          this.csvStore = new CsvStore({
            data : data,
            separator : separator
          });
          this.csvStore.fetch({
            onComplete : lang.hitch(this, this._csvReadComplete),
            onError : lang.hitch(this, function(error) {
              console.error(error) //added this in 20160725_353
            })
          });
      
        } else {
          new Message({

            message : this.nls.error.CSVNoRecords

          });

          domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
          this.clearCSVResults();  
        }
        
        

      } else {
        new Message({
          message : this.nls.error.CSVEmptyFile
        });
        domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
        this.clearCSVResults();
      } 
    },

    _csvReadComplete : function(items) {
      if (items.length <= parseInt(this.config.maxRowCount, 10)) {
        var recCount = items.length.toString();
        domClass.remove(this.results, "hide");
        var objectId = 1;
        var featureCollection = this._generateFeatureCollectionTemplateCSV(this.csvStore, items);
        var popupInfo = this._generateDefaultPopupInfo(featureCollection);
        var infoTemplate = new InfoTemplate(this._buildInfoTemplate(popupInfo));
        //var mapProj = "latlon";
        this.latField = null;
        this.longField = null;
        array.some(this.csvFields, function(fieldName) {
          var matchId;
          matchId = array.indexOf(this.config.latFields, fieldName.toLowerCase());
          if (matchId !== -1) {
            this.latField = fieldName;
          }

          matchId = array.indexOf(this.config.longFields, fieldName.toLowerCase());
          if (matchId !== -1) {
            this.longField = fieldName;
          }
          if (this.latField && this.longField) {
            return true;
          }
          return false;
        }, this);
        if (this.latField === null || this.longField === null) {
          //MJM - no valid lat/long fields, but keep going if there is an 'Address' field - hard-code now, later add to config file
          if (this.csvFields.indexOf('Address') ==-1){
            Message({
              message : this.nls.error.invalidCoord
            });
            this.clearCSVResults();
            return;
          }
          //end MJM

        }
        var errorCnt = 0;
        this.errorList = [];

        array.forEach(items, function(item, i) {
          var errorFlag = false;
          var attributes = {};

          array.forEach(this.combinedFields, function(attr) {
            var value = Number(this.csvStore.getValue(item, attr));
            attributes[attr] = isNaN(value) ? this.csvStore.getValue(item, attr) : value;
          }, this);

          attributes.__OBJECTID = objectId;
          attributes[this.config.intersectField] = this.config.valueOut;
          objectId++;

          if (isNaN(attributes[this.latField]) || isNaN(attributes[this.longField])) {
            //MJM - no valid lat/long fields, but keep going if there is an 'Address' field - hard-code now, later add to config file
            if (this.csvFields.indexOf('Address') ==-1){
              errorFlag = true;
              errorCnt = errorCnt + 1;
               //increase error id by 2 to handle zero start and 1 has header.
              this.errorList.push((parseInt(item._csvId, 10) + 2));
              this.enrichErrors.innerHTML = string.substitute(this.nls.results.recordsError, {
                0 : errorCnt
              });
            }
            //end MJM

          } else {
            var latitude = parseFloat(attributes[this.latField]);
            var longitude = parseFloat(attributes[this.longField]);
          }

          if (!errorFlag) {
              if (this.latField === null || this.longField === null) {
                var geometry = this.getAddressGeometry(attributes.Address); //MJM - use address geometry
              } else {
                var geometry = new Point(webMercatorUtils.lngLatToXY(longitude, latitude), this.srWebMerc);  //use lat/long values
              }

            //MJM------------------------------------------------
            if (geometry!=="Bad address") {
              var feature = {
              'geometry' : geometry.toJson(),
              'attributes' : attributes
            };
            featureCollection.featureSet.features.push(feature);

            } else {
               errorCnt = errorCnt + 1;  //address not found
            } //MJM----------------------------------------------

            this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted, {
              0 : ((i - errorCnt) + 1).toString(),
              1 : recCount
            });
          }

        }, this);  //end loop through all records

        if (this.layerLoaded) {
          this.map.removeLayer(this.featureLayer);
        }

        this.featureLayer = new FeatureLayer(featureCollection, {
          infoTemplate : infoTemplate,
          id : 'csvLayer',
          name : 'CSV Layer'
        });
        this.featureLayer.setRenderer(this.renderer);
        domClass.replace(this.resultsPlottingImage, 'complete', 'processing');
        domClass.remove(this.clearResultsBtn, 'jimu-state-disabled');
        this._zoomToData(this.featureLayer);

        

        var key;
        if (!this.chkboxPlotOnly/*.checked*/) {
          for (key in this.enrichResultsProg) {
            if (this.enrichResultsProg.hasOwnProperty(key)) {
              domStyle.set(this.enrichResultsProg[key], 'display', 'block');
            }
          }
        } else {
          for (key in this.enrichResultsText) {
            if (this.enrichResultsText.hasOwnProperty(key)) {
            }
          }
          for (key in this.enrichResultsProg) {
            if (this.enrichResultsProg.hasOwnProperty(key)) {
              domStyle.set(this.enrichResultsProg[key], 'display', 'none');
            }
          }
        }
      } else {
        new Message({
          message : string.substitute(this.nls.error.tooManyRecords, {
            0 : this.config.maxRowCount
          })
        });
        this.clearCSVResults();
      }
    },
   
    getAddressGeometry: function(address) {
      //MJM - return address geometry
      url1 = "http://arcgisprod01/arcgis/rest/services/DART/Locater_AddressPoint_Gazetteer/GeocodeServer/findAddressCandidates?Address=";
      url2 = String(address);
      url3 = "&outFields=&outSR=4326&f=pjson";  //geographic SR
      url = url1.concat(url2, url3);
      var xhReq = new XMLHttpRequest();
          xhReq.open("GET", url, false);
          xhReq.send(null);
      var serverResponse = xhReq.responseText;
      var d = JSON.parse(serverResponse);

      if (typeof d.candidates[0] == 'undefined') {
        alert("Error in address: " + url2);
        return "Bad address";
      } else {
        //Use top/first(0) candidate
           var geometry = webMercatorUtils
              .geographicToWebMercator(new Point(d.candidates[0].location.x, d.candidates[0].location.y));
           return geometry;
      }
    },
    downloadCSVResults: function() {
      CSVUtils.exportCSVFromFeatureLayer(this.nls.savingCSV, this.featureLayer, {fromClient:true});
    },
    clearCSVResults : function() {
      if (this.layerLoaded) {
        this.map.removeLayer(this.featureLayer);
      }
      domClass.add(this.results, "hide");
      domClass.add(this.clearResultsBtn, 'jimu-state-disabled');
    },

    _getSeparator : function(string) {
      var separators = [',', '      ', ';', '|'];
      var maxSeparatorLength = 0;
      var maxSeparatorValue = '';
      array.forEach(separators, function(separator) {
        var length = string.split(separator).length;
        if (length > maxSeparatorLength) {
          maxSeparatorLength = length;
          maxSeparatorValue = separator;
        }
      });
      return maxSeparatorValue;
    },

    _generateFeatureCollectionTemplateCSV : function(store, items) {
      var featColl = {
        'layerDefinition' : null,
        'featureSet' : {
          'features' : [],
          'geometryType' : 'esriGeometryPoint',
          'spatialReference' : {
            'wkid' : 102100
          }
        }
      };

      featColl.layerDefinition = {
        'geometryType' : 'esriGeometryPoint',
        'objectIdField' : '__OBJECTID',
        'type' : 'Feature Layer',
        'typeIdField' : '',
        'fields' : [{
          'name' : '__OBJECTID',
          'alias' : 'Row Number',
          'type' : 'esriFieldTypeOID',
          'editable' : false,
          'domain' : null
        }],
        'types' : [],
        'capabilities' : 'Query'
      };
      this.csvFields = store.getAttributes(items[0]);
      this.combinedFields = lang.clone(this.csvFields);
      //this.combinedFields.push(this.config.intersectField);

      array.forEach(this.combinedFields, function(field) {
        var value = store.getValue(items[0], field);
        var parsedValue = Number(value);
        if (isNaN(parsedValue) || field === this.config.intersectField) {
          featColl.layerDefinition.fields.push({
            'name' : field,
            'alias' : field,
            'type' : 'esriFieldTypeString',
            'editable' : true,
            'domain' : null
          });
        } else {
          featColl.layerDefinition.fields.push({
            'name' : field,
            'alias' : field,
            'type' : 'esriFieldTypeDouble',
            'editable' : true,
            'domain' : null
          });
        }
      }, this);
      featColl.layerDefinition.fields.push({
        'name' : 'Out',
        'alias' : 'GLProcessed',
        'type' : 'esriFieldTypeString',
        'editable' : false,
        'visible': false,
        'domain' : null
      });
      this.combinedFields = this.combinedFields.concat(this.lookupLayersFieldNames);
      featColl.layerDefinition.fields = featColl.layerDefinition.fields.concat(this.lookupLayersFields);
      return featColl;
    },

    _generateDefaultPopupInfo : function(featureCollection) {
      var fields = featureCollection.layerDefinition.fields;
      var decimal = {
        'esriFieldTypeDouble' : 1,
        'esriFieldTypeSingle' : 1
      };
      var integer = {
        'esriFieldTypeInteger' : 1,
        'esriFieldTypeSmallInteger' : 1
      };
      var dt = {
        'esriFieldTypeDate' : 1
      };
      var displayField = null;
      var fieldInfos = array.map(fields, lang.hitch(this, function(item) {
        if (item.name.toUpperCase() === 'NAME') {
          displayField = item.name;
        }
        var visible = (item.type !== 'esriFieldTypeGlobalID' &&
        item.type !== 'esriFieldTypeGeometry');
        if(item.alias === 'GLProcessed') {
          visible = false;
        }
        var format = null;
        if (visible) {
          var f = item.name.toLowerCase();
          var hideFieldsStr = ',stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,';
          hideFieldsStr = hideFieldsStr + 'subclass,subclass_,rings_ok,rings_nok,';
          if (hideFieldsStr.indexOf(',' + f + ',') > -1 || f.indexOf('_i') === f.length - 2) {
            visible = false;
          }
          if (item.type in integer) {
            format = {
              places : 0,
              digitSeparator : true
            };
          } else if (item.type in decimal) {
            format = {
              places : 4,
              digitSeparator : true
            };
          } else if (item.type in dt) {
            format = {
              dateFormat : 'shortDateShortTime'
            };
          }
        }
        return lang.mixin({}, {
          fieldName : item.name,
          label : item.alias,
          isEditable : false,
          tooltip : '',
          visible : visible,
          format : format,
          stringFieldOption : 'textbox'
        });
      }));

      var popupInfo = {
        title : displayField ? '{' + displayField + '}' : '',
        fieldInfos : fieldInfos,
        description : null,
        showAttachments : false,
        mediaInfos : []
      };
      return popupInfo;
    },

    _buildInfoTemplate : function(popupInfo) {
      var linestyle = 'border:none;border-top: 1px solid #333333;margin-top: 6px;margin-bottom: 6px;';
      var contentString = '<div style="font-weight:bold;">' + this.nls.results.label + '</div>';
      contentString += '<div style="' + linestyle + '"></div><table>';
      var json = {
        content : contentString
      };

      array.forEach(popupInfo.fieldInfos, function(field) {
        if (field.visible) {
          json.content += '<tr><td valign="top" style="color:#888888;padding-right:5px;">';
          json.content += field.label + ': <\/td>';
          json.content += '<td valign="top" style="padding:2px;padding-bottom:5px;">${';
          json.content += field.fieldName + '}<\/td><\/tr>';
        }
      });
      json.content += '<\/table>';
      return json;
    },

    _zoomToData : function(featureLayer) {
      var multipoint = new Multipoint(this.map.spatialReference);
      array.forEach(featureLayer.graphics, function(graphic) {
        var geometry = graphic.geometry;
        if (geometry) {
          multipoint.addPoint({
            x : geometry.x,
            y : geometry.y
          });
        }
      });
      featureLayer.name = 'CSV Layer';
      this.map.addLayer(this.featureLayer);
      this.layerLoaded = true;
      if (multipoint.points.length > 0) {
        this.map.setExtent(multipoint.getExtent().expand(1.05), true);
        if (this.chkboxPlotOnly/*.checked*/) {
          domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
        }
      }
    },
    showErrorTable : function() {
      var errorDivStatus = domStyle.get(this.enrichErrorsList, 'display');
      if (errorDivStatus === 'none') {
        var content = "";
        array.forEach(this.errorList, lang.hitch(this, function(error) {
          content = content + string.substitute(this.nls.results.recordsErrorList, {
            0 : error
          }) + '<br>';
        }));
        this.enrichErrorsList.innerHTML = content;
        domStyle.set(this.enrichErrorsList, 'display', 'block');
      } else {
        domStyle.set(this.enrichErrorsList, 'display', 'none');
      }
    }

  });

});
