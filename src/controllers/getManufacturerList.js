const config = require("config");
const { Sentry } = require("vod-npm-sentry");
const sentryCategory = config.get("sentry.categories.getManufacturerList");
const { upgradesService } = require("vod-npm-services");
const client = require("restify-prom-bundle").client;
const getManufacturerListError = new client.Counter({
  name: "counter_get_app_manufacturer_list_error",
  help: "vod-ms-upgrades config map call error",
});

exports.handler = async function getManufacturerList(req, res, next) {
  Sentry.info("Beginning getManufacturerList...", {}, sentryCategory);

  const params = {
    headers: req.headers,
  };

  const response = await upgradesService.getConfig(req, params);
  let output = "";
  if (response.ok == false) {
    output = {
      code: response.error.response.status,
      status: response.error.response.statusText,
      message: response.error.response.data.messages[0].message,
    };
    getManufacturerListError.inc();
    res.status(output.code);
    res.json(output);
    return next(response.error);
  } else {
    const manufacturerList = {
      description: "brandName of devices",
      name: "devicebrandName",
      subCategory: response.data.result.properties.brandName,
    };

    res.status(response.status);
    res.json(manufacturerList);

    return next();
  }
  /*if (!response.ok) {
    getManufacturerListError.inc();
    return next(response.error);
  }*/
};