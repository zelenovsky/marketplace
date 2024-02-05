/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "t2az8a7s1oa6a7z",
    "created": "2024-02-05 07:37:35.311Z",
    "updated": "2024-02-05 07:37:35.311Z",
    "name": "cdek_deliveries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lsyrlfi1",
        "name": "order",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "c6w97fwef7hrhg1",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "wtjwkvv7",
        "name": "delivery_point",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dsmmdmak",
        "name": "city_code",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("t2az8a7s1oa6a7z");

  return dao.deleteCollection(collection);
})