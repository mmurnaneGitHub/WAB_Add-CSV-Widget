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
        //'dojo/dom-construct',
        'dojo/dom-style',
        'dojox/data/CsvStore',
        'esri/geometry/webMercatorUtils',
        'esri/layers/FeatureLayer',
        'esri/geometry/Multipoint',
        'esri/geometry/Point',
        'esri/InfoTemplate',
        //'esri/tasks/query',
        'esri/tasks/QueryTask',
        'esri/SpatialReference',
        'esri/symbols/jsonUtils',
        'esri/renderers/UniqueValueRenderer',
        //commented out by the factory...
        'jimu/dijit/Message',
        //'jimu/CSVUtils',
        'jimu/utils',
        './layerQueryDetails'],
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
        //domConstruct,
        domStyle,
        CsvStore,
        webMercatorUtils,
        FeatureLayer,
        Multipoint,
        Point,
        InfoTemplate,
        //Query,
        QueryTask,
        SpatialReference,
        symbolJsonUtils,
        UniqueValueRenderer,
        //commented out by the factory...
        Message,
        //CSVUtils,
        utils,
        layerQueryDetails) {

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
    /*postCreate : function() {
      this.inherited(arguments);

      domClass.add(this.downloadResultsBtn, "hide");
    },
*/
    
    startup : function() {
      this.inherited(arguments);
      //this.loading.show();
      //widget is operational with this commented out, 20160711_202...SB
      //widget description piece...SB
      //html.place(html.toDom(this.nls.description), this.widgetDescription);
      //console.error(this.widgetDescription);
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
          //widget is operational with this commented out, 20160711_202...SB
          //The next line was commented out....20160711_134
          //domClass.add(this.csvFileInput, 'fileInputNonHTML5, js-fileapi-wrapper');
        }));
      } else {
        //widget is operational with this commented out, 20160711_202...SB
        //The next two lines were commented out....20160711_134
        //domClass.add(this.csvFileInput, 'fileInputHTML5');
        //domClass.remove(this.showFileDialogBtn, 'hide');
      }


      /*this._initalizeLookupLayers();
      console.error(this.config.enrichLayers)//SB 20160713
      array.forEach(this.config.enrichLayers, function(lay) {
        var textID = lay.id;
        console.error(textID)//SB 20160713_434
        var progID = lay.id + '_prog';
        var row = domConstruct.toDom(
        "<tr class='controls'>" + "<td><div id='" + progID +
        "' class='status processing' /></td>" + "<td><div id='" + textID +
        "' class='result-text' ></div>" + "</td></tr>");

        domConstruct.place(row, this.widgetsResultsTableBody);
        this.enrichResultsProg[textID] = dom.byId(progID);
        this.enrichResultsText[textID] = dom.byId(textID);
        this.enrichResultsText[textID].innerHTML = string.substitute(
          this.nls.results, { //.recordsEnriched, {
          0 : 0,
          1 : 0,
          2 : 0,
          3 : lay.label
        });
      }, this);
      domClass.add(this.clearResultsBtn, 'jimu-state-disabled');
      this.loading.hide();*/
    },
    
    _buildRenderer : function() {

      this.symIn = symbolJsonUtils.fromJson(this.config.SymbolWithin);
      this.symOut = symbolJsonUtils.fromJson(this.config.SymbolOutside);
      this.renderer = new UniqueValueRenderer(this.symOut, this.config.intersectField);
      this.renderer.addValue(this.config.valueIn, this.symIn);
      this.renderer.addValue(this.config.valueOut, this.symOut);

    },
    
    _initalizeLookupLayers : function() {
      this.lookupLayersField = [];
      this.lookupLayersFieldNames = [];
      var fieldNames;
      var fieldAlias;
      array.forEach(this.config.enrichLayers, function(configLayer) {
        fieldNames = array.map(configLayer.fields, function(field) {
          return field.fieldName;
        });
        fieldAlias = array.map(configLayer.fields, function(field) {
          return field.label;
        });
        array.forEach(fieldNames, function(field) {
          var fieldStruct = {
          'name' : null,
          'alias' : null,
          'type' : 'esriFieldTypeString',
          'editable' : true,
          'domain' : null
        };
          if (this.lookupLayersFieldNames.indexOf(field) < 0) {
            var aliasPosition = fieldNames.indexOf(field);
            fieldStruct.name = field;
            fieldStruct.alias = fieldAlias[aliasPosition];
            this.lookupLayersFieldNames.push(fieldStruct.name);
            this.lookupLayersFields.push(fieldStruct);
          }
        }, this);
      }, this);
    },
    
    //widget is operational with this commented out, 20160711_202...SB
    //removed this, app breaks but no error message just the spinny loader thing...html lines 14-19 commented out with this.
    /*fileSelected : function() {
      if (utils.file.supportHTML5()) {
        this._processFiles(this.csvFileInput.files);
      } else if (utils.file.supportFileAPI()) {
        this._processFiles(window.FileAPI.getFiles(this.csvFileInput));
      } else {
        console.log("no file handler support !");
      }
      this.csvFileInput.value = null;
      domClass.add(this.downloadResultsBtn, "hide");
    },*/
    

    _handleCSVDrop : function(event) {
      event.preventDefault();
      var dataTransfer = event.dataTransfer;
      //widget is operational with this commented out, 20160711_202...SB
      //commented out for the add data button...SB
      //if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled')) {
        //return;
      //}
      //domClass.add(this.downloadResultsBtn, "hide");
      this._processFiles(dataTransfer.files);

    },
    _processFiles : function(files) {
      //console.error(files)
      //console.error(files[0].name)
      //console.error(files[0].name.split('.').pop());
      //widget is operational with this commented out, 20160711_202...SB
      //commented out by SB to troubleshoot why the widget is not operational...
      //domClass.add(this.showFileDialogBtn, 'jimu-state-disabled');
      //this._resetResults();
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
      //factory error checking I believe...SB
      //console.log('Reading CSV: ', file, ', ', file.name, ', ', file.type, ', ', file.size);
      if (utils.file.supportHTML5()) {
        var reader = new FileReader();
        reader.onload = lang.hitch(this, function() {
          //testing messages function and removal of such...220
          this._processCSVData(reader.result);
        });
        reader.readAsText(file);
      } else {
        //factory error checking I believe...SB
        //console.log(window.atob);
        window.FileAPI.readAsText(file, lang.hitch(this, function (evt) {
          //factory error checking I believe...SB
          //console.log('result: ' + evt.result);
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
          //removed this next line to get rid of messages but it didn't help, won't accept csv currently...222
          this.csvStore.fetch({
            //comment the next line out the panel won't accept the csv...SB 228
            onComplete : lang.hitch(this, this._csvReadComplete),
            onError : lang.hitch(this, function(error) {
              console.error(error) //added this in 20160725_353

              //working on messages...commented out, csv tool works just never stops trying to load all the messages....SB...20160711_338
              //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
              //console.error(this.nls.error.fetchingCSV);//20160713, error checking trying to get rid of errors....chasing them down. 20160725_1131
              /*var msg = string.substitute(this.nls.error.fetchingCSV, {
                0 : error.message
              });*/
              //console.error(msg)
              //removed to get rid of messages, hopefully...218...didn't work...
              /*Message({
                message : msg
              });
              console.error(msg, error);*/
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
        //console.error(recCount);//SB debugging and error checking
        //debugger;
        domClass.remove(this.results, "hide");
        //this.resultsLoading.innerHTML = string.substitute(this.nls.results.csvLoaded, {
         // 0 : recCount
       //});
        //domClass.replace(this.resultsLoadingImage, "complete", "processing");

        var objectId = 1;
        var featureCollection = this._generateFeatureCollectionTemplateCSV(this.csvStore, items);
        var popupInfo = this._generateDefaultPopupInfo(featureCollection);
        var infoTemplate = new InfoTemplate(this._buildInfoTemplate(popupInfo));


        var mapProj = "latlon";
        //widget is operational with this commented out, 20160711_202...SB
/*      removed as part of the map projection radio button...SB

        array.forEach(this.inputForm.rdProjection, lang.hitch(this, function(radio){
          if(radio.checked) {
            mapProj = radio.value;
          }
        }));
*/

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
          Message({
            message : this.nls.error.invalidCoord
          });
          this.clearCSVResults();
          return;
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
            errorFlag = true;
            errorCnt = errorCnt + 1;
            //factory comment below, one line...SB
            //increase error id by 2 to handle zero start and 1 has header.
            this.errorList.push((parseInt(item._csvId, 10) + 2));
            this.enrichErrors.innerHTML = string.substitute(this.nls.results.recordsError, {
              0 : errorCnt
            });
          } else {
            var latitude = parseFloat(attributes[this.latField]);
            var longitude = parseFloat(attributes[this.longField]);
          }

          if (!errorFlag) {
            if(mapProj === 'latlon') {
              var geometry = new Point(webMercatorUtils.lngLatToXY(longitude, latitude), this.srWebMerc);
            } else {
              var geometry = new Point(longitude, latitude, this.srWebMerc);
            }

            var feature = {
              'geometry' : geometry.toJson(),
              'attributes' : attributes
            };
            featureCollection.featureSet.features.push(feature);
            this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted, {
              0 : ((i - errorCnt) + 1).toString(),
              1 : recCount
            });
          }
        }, this);

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
        //widget is operational with this commented out, 20160711_202...SB
        //.checked was commented out to get rid of the checkbox for points only on the map...SB
        if (!this.chkboxPlotOnly/*.checked*/) {
          //this._enrichData(this.featureLayer, this.config.enrichLayers); 20160727_1028, removed to clear error msg from line 328 message is not defined, still getting this when I put in csv sheets with errors.
          for (key in this.enrichResultsProg) {
            if (this.enrichResultsProg.hasOwnProperty(key)) {
              domStyle.set(this.enrichResultsProg[key], 'display', 'block');
            }
          }
        } else {
          for (key in this.enrichResultsText) {
            if (this.enrichResultsText.hasOwnProperty(key)) {
              //this.enrichResultsText[key].innerHTML = ''; 20160727_1052, removed to clear error regarding innerHTML, still getting message is not defined though on 328 and 338
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
    //FACTORY NOTES:
    //This function breaks up the csv points into manageable chunks then sends the arrray
    // of chunks to a deferred object then calls the selectFeatures callback function.
    


/*
    _enrichData : function(flayer, enrichLayers) {
      this.syncLayers = [];
      var counter = 0;
      var points = 1;
      var arrGraphics = [];
      arrGraphics[counter] = [];
      array.forEach(flayer.graphics, lang.hitch(this, function(graphic) {
        if (points >= parseInt(this.config.cacheNumber, 10)) {
          arrGraphics[counter].push(graphic);
          if (flayer.graphics.length > ((counter + 1) * parseInt(this.config.cacheNumber, 10))) {
            counter++;
            points = 1;
            arrGraphics[counter] = [];
          }
        } else {
          arrGraphics[counter].push(graphic);
          points++;
        }
      }));

      array.forEach(enrichLayers, function(layer) {
        var idx = 0;
        var fields = array.map(layer.fields, function(field) {
          return field.fieldName;
        });
        var syncDet = new layerQueryDetails({
          'layer' : layer,
          'numberOfRequest' : flayer.graphics.length,
          'totalRecords' : flayer.graphics.length,
          'numberOfHits' : 0,
          'fields' : fields,
          'intersectField' : this.config.intersectField,
          'valueIn' : this.config.valueIn,
          'valueOut' : this.config.valueOut,
          'valueInSym' : this.symIn,
          'valueOutSym' : this.symOut
        });
        this.own(on(syncDet, 'complete', lang.hitch(this, this._syncComplete)));
        this.own(on(syncDet, 'requestComplete', lang.hitch(this, this._requestComplete)));
        this.own(on(syncDet, 'error', lang.hitch(this, this._deferredErrorCallback)));
        this.syncLayers.push(syncDet);

        this.queryCallback(arrGraphics, idx, layer, fields, syncDet);

      }, this);
    },


*/




    //FACTORY NOTES:
    // This function creates a multipoint geometry to just a geometry filter in selectFeatures call.
    // The function then calls selectFeatures recursively and sequentially for each enrich layer
    // against the point chunks.
    /*queryCallback : function(chunks, idx, layer, fields, syncDet) {
      var def;
      var multipoint = new Multipoint(this.map.spatialReference);
      array.forEach(chunks[idx], function(graphic) {
        var geometry = graphic.geometry;
        if (geometry) {
          multipoint.addPoint({
            x : geometry.x,
            y : geometry.y
          });
        }
      });
      var queryTask = new QueryTask(layer.url);
      if (idx === 0) {
        var query = new Query();
        query.returnGeometry = true;
        query.outFields = ["*"];
        query.geometry = multipoint;
        def = queryTask.execute(query, lang.hitch(this,
          this.queryCallback(chunks, idx + 1, layer, fields, syncDet)),
          lang.hitch(this, this.queryErrorback(layer)
        ));
        //widget is operational with this commented out, 20160711_202...SB
        //Next two lines are commented out from the factory...SB
        //layer.mapLayer.setAutoGeneralize(false);
        //def = layer.mapLayer.selectFeatures(query, FeatureLayer.MODE_ONDEMAND, lang.hitch(this, this.queryCallback(chunks, idx + 1, layer, fields, syncDet)), lang.hitch(this, this.queryErrorback(layer)));
        syncDet.addDeferred(def, chunks[idx]);
        this.featureLayer.redraw();
      } else {
        return function(results) {
          if (chunks.length > idx) {
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ["*"];
            query.geometry = multipoint;
            def = queryTask.execute(query, lang.hitch(this,
              this.queryCallback(chunks, idx + 1, layer, fields, syncDet)),
              lang.hitch(this, this.queryErrorback(layer)
            ));
            //widget is operational with this commented out, 20160711_202...SB
            //Next two lines are commented out from the factory...SB
            //layer.mapLayer.setAutoGeneralize(false);
            //def = layer.mapLayer.selectFeatures(query, FeatureLayer.MODE_ONDEMAND, lang.hitch(this, this.queryCallback(chunks, idx + 1, layer, fields, syncDet)), lang.hitch(this, this.queryErrorback(layer)));
            syncDet.addDeferred(def, chunks[idx]);
            this.featureLayer.redraw();
          }
          return {
            'results' : results
          };
        };
      }
    },
    queryErrorback : function(layer) {
      return lang.hitch(this, function(err) {
        if (this.enrichResultsProg.hasOwnProperty(layer.id)) {
          domClass.replace(this.enrichResultsProg[layer.id], 'error', 'complete');
          domClass.replace(this.enrichResultsProg[layer.id], 'error', 'processing');
        }
        console.log(err);
        return err;
      });
    },
    _deferredErrorCallback : function(args) {
      if (this.enrichResultsProg.hasOwnProperty(args.layerID)) {
        domClass.replace(this.enrichResultsProg[args.layerID], 'error', 'complete');
        domClass.replace(this.enrichResultsProg[args.layerID], 'error', 'processing');
      }
    },
*/



    /*_syncComplete : function(args) {
      domClass.replace(this.enrichResultsProg[args.layerID], 'complete', 'processing');
      var stillProc = array.some(this.syncLayers, function(syncDet) {

        return !syncDet.isComplete();
      }, this);
      if (stillProc) {
        return;
      }
      this.featureLayer.redraw();
domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
      domClass.remove(this.downloadResultsBtn, "hide");
    },*/

    //removed this section, doesn't affect widget as of 20160711_400
    /*_requestComplete : function(args) {
      this.enrichResultsText[args.layerID].innerHTML = string.substitute(this.nls.results,//.recordsEnriched,
      {
        0 : args.currentNumber,
        1 : args.totalRecords,
        2 : args.intesected,
        3 : args.name
      });
      this.featureLayer.redraw();
    },
*/

//removed this section, doesn't affect widget as of 20160711_359
    /*_resetResults : function() {
      domClass.replace(this.resultsLoadingImage, 'processing', 'complete');
      domClass.replace(this.resultsPlottingImage, 'processing', 'complete');
      var key;
      var labelText = '';
      for (key in this.enrichResultsProg) {
        if (this.enrichResultsProg.hasOwnProperty(key)) {
          domClass.replace(this.enrichResultsProg[key], 'processing', 'error');
          domClass.replace(this.enrichResultsProg[key], 'processing', 'complete');
        }
      }
      var cb = lang.hitch(this, function(layer) {
        if(layer.id === key) {
          mapLay = layer;
        }
      });
      for (key in this.enrichResultsProg) {
        if (this.enrichResultsText.hasOwnProperty(key)) {
          var mapLay;
          array.forEach(this.config.enrichLayers, cb);

          if(mapLay) {
            labelText = mapLay.label;
          }

           this.enrichResultsText[key].innerHTML = string.substitute(this.nls.results,//.recordsEnriched, SB removed for enrich data message, 20160711_329
          //removal of code above allows for an operating widget but the loading spinny thing on both line 3 of messages as well as in the center of the panel never stops...SB
          {
            //0 : 0,
            //1 : 0,
            //2 : 0,
            //3 : labelText
          });

        }
      }

      this.resultsLoading.innerHTML = string.substitute(this.nls.results.csvLoaded, {
        //0 : 0
      });

      this.enrichErrors.innerHTML = '';
      this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted, {
        //0 : 0,
        //1 : 0
      });

    },*/


    

    downloadCSVResults: function() {

      CSVUtils.exportCSVFromFeatureLayer(this.nls.savingCSV, this.featureLayer, {fromClient:true});
    },



    clearCSVResults : function() {
      if (this.layerLoaded) {
        this.map.removeLayer(this.featureLayer);
        //factory comment...SB
        //this.featureLayer = null;
      }
      //this next line when commented out fully resets the messages and data on the map once clera has been pressed, widget is operational....SB....20160711_353
      //this._resetResults();
      //domClass.add(this.downloadResultsBtn, "hide"); ********
      domClass.add(this.results, "hide");
      //domStyle.set(this.enrichErrorsList, 'display', 'none');
      //widget is operational with this commented out, 20160711_202...SB
      //commented out because line is not needed to have the panel operate correctly...SB
      //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
      domClass.add(this.clearResultsBtn, 'jimu-state-disabled');
    },
    /*
    destroy: function() {
      if (this.layerLoaded) {
        this.map.removeLayer(this.featureLayer);
      }
      this.inherited(arguments);
    },
    */
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
      this.combinedFields.push(this.config.intersectField);

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
        //next line was originally commented out...SB
        //var visible = (item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeGeometry');
        if(item.alias === 'GLProcessed') {
          visible = false;
        }
        var format = null;
        if (visible) {
          var f = item.name.toLowerCase();
          var hideFieldsStr = ',stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,';
          hideFieldsStr = hideFieldsStr + 'subclass,subclass_,rings_ok,rings_nok,';
          //next line was originally commented out...SB
          //if (hideFieldsStr.indexOf(',' + f + ',') > -1 || f.indexOf('objectid') > -1 || f.indexOf('_i') === f.length - 2) {
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

    //widget fails with this chunk removed...SB...20160711_414
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


    //This is needed...widget fails without it...SB...20160711_413
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
        //widget is operational with this commented out, 20160711_202...SB
        //.checked was commented out to get rid of checkbox for points only on map...SB
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
