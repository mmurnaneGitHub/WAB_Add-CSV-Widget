﻿define(
   ({
    settingsHeader : "Введите описание для виджета GeoLookup",
    settingsDesc : "Геообогащение списка местоположений из CSV-файла на полигональных слоях карты. Выбранные поля из полигональных слоев присоединяются к местоположениям.",
    settingsLoadingLayers: "Подождите пока загружаются слои.",
    settingsConfigureTitle: "Настроить поля слоя",
    layerTable : {
      colEnrich : "Обогатить",
      colLabel : "Слой",
      colFieldSelector : "Поля"
    },
    fieldTable : {
      colAppend : "Присоединить",
      colName : "Имя",
      colAlias : "Псевдоним",
      colOrder : "Действия",
      label : "Отметьте поля, которые хотите присоединить. Выберите поле, чтобы обновить его псевдоним и порядок сортировки."
    },
    symbolArea : {
      symbolLabelWithin : 'Выберите символ для местоположений в:',
      symbolLabelOutside : 'Выберите символ для местоположений вне:'
    },
    advSettings : {
      label: "Дополнительные настройки", 
      latFieldsDesc : "Возможные имена для поля Широта.",
      longFieldsDesc : "Возможные имена для поля Долгота.",
      intersectFieldDesc : "Имя поля, созданного для хранения значения, если поиск пересекает слой.",
      intersectInDesc : "Сохраняемое значение, если местоположение пересекает полигон.",
      intersectOutDesc : "Сохраняемое значение, если местоположение не пересекает полигон.",
      maxRowCount : "Максимальное число строк в файле CSV.",
      cacheNumberDesc : "Порог кластеризации точек для более быстрой обработки.",
      subTitle : "Задать значения для файла CSV."
    },
    noPolygonLayers : "Нет полигональных слоев",
    errorOnOk : "Введите все параметры перед сохранением конфигурации",
    saveFields : "Сохранить поля",
    cancelFields : "Отменить поля",
    saveAdv : "Сохранить доп. настройки",
    cancelAdv : "Отменить доп. настройки",
    advSettingsBtn : "Дополнительные настройки",
    chooseSymbol: "Выберите символ",
    okBtn: "OK",
    cancelBtn: "Отмена"
  })
);
