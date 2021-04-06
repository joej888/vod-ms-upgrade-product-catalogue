const config = require("config");
const { Sentry } = require("vod-npm-sentry");
const sentryCategory = config.get("sentry.categories.getDeviceModels");
const { devicesService } = require("vod-npm-services");
const client = require("restify-prom-bundle").client;
const getDeviceModelsError = new client.Counter({
  name: "counter_get_app_device_models_error",
  help: "vod-ms-devices client call error",
});

exports.handler = async function getDeviceModels(req, res, next) {
  Sentry.info("Beginning getDeviceModels...", {}, sentryCategory);
  const params = {
    headers: req.headers,
    manufacturer: req.query.brandName,
  };

  let response = await devicesService.getDeviceModels(req, params);
  let output = "";
  if (response.ok == false) {
    output = {
      code: response.error.response.status,
      status: response.error.response.statusText,
      message: response.error.response.data.messages[0].message,
    }

    getDeviceModelsError.inc();
    res.status(output.code);
    res.json(output);
    return next(response.error);
  } else {
    const jsonData = response.data.result;
    function getModelsDetails(model) {
      let modelDetails = {
        name: "model",
        valueType: "string",
        productSpecCharacteristicValue: {
          value: model.model,
        },
      };
      return modelDetails;
    }

    function getMapped(jsonData) {
      return jsonData.map(getModelsDetails);
    }
    let brand = response.data.result[0].manufacturer;
    let myArr = getMapped(jsonData);
    output = {
      brand: brand,
      description: "model name of devices",
      productSpecCharacteristic: myArr,
    };
    res.status(response.status);
    res.json(output);
  }
};