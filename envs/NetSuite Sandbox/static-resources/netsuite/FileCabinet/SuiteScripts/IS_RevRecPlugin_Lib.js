/**
 * Revenue Management Plug-in Library
 * @suiteScriptVersion 2.x
 */
define(["N/search", "N/record", "N/runtime", "N/query", "N/dataset"], function (search, record, runtime, query, dataset) {
  var ts = Date.now();
  log.audit(ts + " START - Library Globals", "");

  var sourceRecordType = "customrecord_contractlines";
  //var ALL_SOURCE_DATA = {};
  var ALL_SOURCE_DATA_NEW = {};
  var ALL_SOURCE_DATA_UPDATE = {};
  var SOURCE_EXTERNAL_ID_TO_SOURCE_ID = {};
  var NEW_SOURCE_EXTERNAL_IDS = [];
  var UPDATE_SOURCE_EXTERNAL_IDS = [];



  function getSourceDataNew(){

    var orderProductsDataset = dataset.load({
      id: "custdataset_order_products_create"
    });
    // Run the dataset as a paged query and loop through them with an iterator
    var pagedResults = orderProductsDataset.runPaged({
      pageSize: 1000
    });
    log.audit(ts + " pagedResultsCount: " + pagedResults.count);
    var resultIterator = pagedResults.iterator();

    // Use the iterator to process each page of results
    var rowCount = 0;
    resultIterator.each(function (page) {
      log.debug("sqlCount: " + page.value.pagedData.count);
      var pageIterator = page.value.data.iterator();
      var rowCount = 0;
      pageIterator.each(function (row) {
        var result = row.value.asMap();
        rowCount = rowCount + 1;
        log.debug("Page: " + (page.value.pageRange.index + 1) + " Row:" + rowCount);

        /*****************/
        var internalId = result.id;
        log.debug("internalId", internalId);
        var sourceExternalId = result.custrecord_is_cl_source_ext_id;
        log.debug("sourceExternalId", sourceExternalId);
        var newSourceExternalId = result.custrecord_is_new_ext_id;
        log.debug("newSourceExternalId", newSourceExternalId);
        // var updateSourceExternalId = result.custrecord_is_update_rev_element;
        // log.debug("updateSourceExternalId", updateSourceExternalId);

        var customer = result.custrecord_is_cl_customer;

        var project = result.custrecord_is_cl_job;
        if (!isEmpty(project)) {
          customer = project;
        }

        var accountingBook = result.custrecord_is_cl_acct_book;
        log.debug("accountingbook", accountingBook);

        if (newSourceExternalId == true) {
          NEW_SOURCE_EXTERNAL_IDS.push(sourceExternalId);
          log.debug("Source ID: " + sourceExternalId, "Added to NEW_SOURCE_EXTERNAL_IDS");
        }
        // if (updateSourceExternalId == true) {
        //   UPDATE_SOURCE_EXTERNAL_IDS.push(sourceExternalId);
        //   log.debug("Source ID: " + sourceExternalId, "Added to UPDATE_SOURCE_EXTERNAL_IDS");
        // }

        SOURCE_EXTERNAL_ID_TO_SOURCE_ID[sourceExternalId] = internalId;

        log.debug("ALL_SOURCE_DATA for sourceExternalId", sourceExternalId);
        log.debug("ALL_SOURCE_DATA order", result.custrecord_is_cl_order);
        log.debug("ALL_SOURCE_DATA item", result.custrecord_is_cl_item);
        log.debug("ALL_SOURCE_DATA quantity", result.custrecord_is_cl_quantity);

        ALL_SOURCE_DATA_NEW[sourceExternalId] = {
          contracttag: result.custrecord_is_cl_contracttag,
          order: result.custrecord_is_cl_order,
          item: result.custrecord_is_cl_item,
          quantity: result.custrecord_is_cl_quantity,
          price: result.custrecord_is_cl_price,
          totalprice: result.custrecord_is_cl_totalprice,
          customer: customer,
          enduser: result.custrecord_op_end_user,
          date: result.custrecord_is_cl_date,
          sed: result.custrecord_is_cl_source_ext_id,
          revrecstartdate: result.custrecord_is_revrec_startdate,
          revrecenddate: result.custrecord_is_revrec_enddate,
          subsidiary: result.custrecord_is_cl_subsidiary,
          currency: result.custrecord_is_cl_currency,
          location: result.custrecord_is_cl_location,
          department: result.custrecord_op_department,
          classification: result.custrecord_op_erp,
          exchangerate: result.custrecord_is_cl_exchangerate,
          sfdealid: result.custrecord_is_cl_sf_deal_id,
          basessp: result.custrecord_is_cl_base_ssp,
          partnerdiscount: result.custrecord_op_partner_disc_percent,
          prorationfactor: result.custrecord_is_cl_proration_factor,
          tiermultiplier: result.custrecord_is_cl_tier_multiplier,
          disctiermultiplier: result.custrecord_is_cl_disc_tier_mult,
          blockpricemultiplier: result.custrecord_is_cl_block_mult,
          tiermultdesc: result.custrecord_is_cl_tier_multiplier_desc,
          disctierdesc: result.custrecord_is_cl_discount_tier_desc,
          blocktierdesc: result.custrecord_is_cl_block_tier_desc,
          thirdptycommrate: result.custrecord_op_jv_resellrate,
          accountingbook: accountingBook,
        };
        log.debug("ALL_SOURCE_DATA all values", ALL_SOURCE_DATA_NEW[sourceExternalId]);
        log.debug("ALL_SOURCE_DATA all values full array", ALL_SOURCE_DATA_NEW);
        log.debug("NEW_SOURCE_EXTERNAL_IDS", NEW_SOURCE_EXTERNAL_IDS);
        log.debug("UPDATE_SOURCE_EXTERNAL_IDS", UPDATE_SOURCE_EXTERNAL_IDS);
        log.debug(" SOURCE_EXTERNAL_ID_TO_SOURCE_ID",  SOURCE_EXTERNAL_ID_TO_SOURCE_ID);

        var remUsage = runtime.getCurrentScript().getRemainingUsage();
        log.debug("Remaining Governance Units", remUsage);
        return true;
      });
      log.audit(ts + " Completed Page: " + (page.value.pageRange.index + 1));
      return true;
    });



  }

  function getSourceDataUpdate(){

    var orderProductsDataset = dataset.load({
      id: "custdataset_order_products_update"
    });
    // Run the dataset as a paged query and loop through them with an iterator
    var pagedResults = orderProductsDataset.runPaged({
      pageSize: 1000
    });
    log.audit(ts + " pagedResultsCount: " + pagedResults.count);
    var resultIterator = pagedResults.iterator();

    // Use the iterator to process each page of results
    var rowCount = 0;
    resultIterator.each(function (page) {
      log.debug("sqlCount: " + page.value.pagedData.count);
      var pageIterator = page.value.data.iterator();
      var rowCount = 0;
      pageIterator.each(function (row) {
        var result = row.value.asMap();
        rowCount = rowCount + 1;
        log.debug("Page: " + (page.value.pageRange.index + 1) + " Row:" + rowCount);

        /*****************/
        var internalId = result.id;
        log.debug("internalId", internalId);
        var sourceExternalId = result.custrecord_is_cl_source_ext_id;
        log.debug("sourceExternalId", sourceExternalId);
        // var newSourceExternalId = result.custrecord_is_new_ext_id;
        // log.debug("newSourceExternalId", newSourceExternalId);
        var updateSourceExternalId = result.custrecord_is_update_rev_element;
        log.debug("updateSourceExternalId", updateSourceExternalId);

        var customer = result.custrecord_is_cl_customer;

        var project = result.custrecord_is_cl_job;
        if (!isEmpty(project)) {
          customer = project;
        }

        var accountingBook = result.custrecord_is_cl_acct_book;
        log.debug("accountingbook", accountingBook);

        // if (newSourceExternalId == true) {
        //   NEW_SOURCE_EXTERNAL_IDS.push(sourceExternalId);
        //   log.debug("Source ID: " + sourceExternalId, "Added to NEW_SOURCE_EXTERNAL_IDS");
        // }
        if (updateSourceExternalId == true) {
          UPDATE_SOURCE_EXTERNAL_IDS.push(sourceExternalId);
          log.debug("Source ID: " + sourceExternalId, "Added to UPDATE_SOURCE_EXTERNAL_IDS");
        }

        SOURCE_EXTERNAL_ID_TO_SOURCE_ID[sourceExternalId] = internalId;

        log.debug("ALL_SOURCE_DATA for sourceExternalId", sourceExternalId);
        log.debug("ALL_SOURCE_DATA order", result.custrecord_is_cl_order);
        log.debug("ALL_SOURCE_DATA item", result.custrecord_is_cl_item);
        log.debug("ALL_SOURCE_DATA quantity", result.custrecord_is_cl_quantity);

        ALL_SOURCE_DATA_UPDATE[sourceExternalId] = {
          contracttag: result.custrecord_is_cl_contracttag,
          order: result.custrecord_is_cl_order,
          item: result.custrecord_is_cl_item,
          quantity: result.custrecord_is_cl_quantity,
          price: result.custrecord_is_cl_price,
          totalprice: result.custrecord_is_cl_totalprice,
          customer: customer,
          enduser: result.custrecord_op_end_user,
          date: result.custrecord_is_cl_date,
          sed: result.custrecord_is_cl_source_ext_id,
          revrecstartdate: result.custrecord_is_revrec_startdate,
          revrecenddate: result.custrecord_is_revrec_enddate,
          subsidiary: result.custrecord_is_cl_subsidiary,
          currency: result.custrecord_is_cl_currency,
          location: result.custrecord_is_cl_location,
          department: result.custrecord_op_department,
          classification: result.custrecord_op_erp,
          exchangerate: result.custrecord_is_cl_exchangerate,
          sfdealid: result.custrecord_is_cl_sf_deal_id,
          basessp: result.custrecord_is_cl_base_ssp,
          partnerdiscount: result.custrecord_op_partner_disc_percent,
          prorationfactor: result.custrecord_is_cl_proration_factor,
          tiermultiplier: result.custrecord_is_cl_tier_multiplier,
          disctiermultiplier: result.custrecord_is_cl_disc_tier_mult,
          blockpricemultiplier: result.custrecord_is_cl_block_mult,
          tiermultdesc: result.custrecord_is_cl_tier_multiplier_desc,
          disctierdesc: result.custrecord_is_cl_discount_tier_desc,
          blocktierdesc: result.custrecord_is_cl_block_tier_desc,
          thirdptycommrate: result.custrecord_op_jv_resellrate,
          accountingbook: accountingBook,
        };
        log.debug("ALL_SOURCE_DATA all values", ALL_SOURCE_DATA_UPDATE[sourceExternalId]);
        log.debug("ALL_SOURCE_DATA all values full array", ALL_SOURCE_DATA_UPDATE);
        log.debug("NEW_SOURCE_EXTERNAL_IDS", NEW_SOURCE_EXTERNAL_IDS);
        log.debug("UPDATE_SOURCE_EXTERNAL_IDS", UPDATE_SOURCE_EXTERNAL_IDS);
        log.debug(" SOURCE_EXTERNAL_ID_TO_SOURCE_ID",  SOURCE_EXTERNAL_ID_TO_SOURCE_ID);

        var remUsage = runtime.getCurrentScript().getRemainingUsage();
        log.debug("Remaining Governance Units", remUsage);
        return true;
      });
      log.audit(ts + " Completed Page: " + (page.value.pageRange.index + 1));
      return true;
    });



  }

  function getSourceRecordType() {
    return sourceRecordType;
  }

  function getSourceExternalIdsForRevenueElementCreation() {
    getSourceDataNew();
    return NEW_SOURCE_EXTERNAL_IDS;
  }

  function getSourceExternalIdsForRevenueElementUpdate() {
    getSourceDataUpdate();
    return UPDATE_SOURCE_EXTERNAL_IDS;
  }

  function getOrder(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].order;
  }

  function getArrangementKey(sourceExternalId) {
    log.debug("getArrangementKey for sourceExternalId", sourceExternalId);
    log.debug("getArrangementKey all values", ALL_SOURCE_DATA[sourceExternalId]);

    var arrangementKey = ALL_SOURCE_DATA[sourceExternalId].order;
    log.debug("arrangementKey", arrangementKey);
    return arrangementKey;
  }

  function getSubsidiary(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].subsidiary;
  }

  function getLocation(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].location;
  }

  function getDepartment(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].department;
  }

  function getClassification(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].classification;
  }

  function getCurrency(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].currency;
  }

  function getAccountingBook(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].accountingbook;
  }

  function getItem(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].item;
  }

  function getQuantity(sourceExternalId) {
    log.debug("getQuantity for Source External ID: " + sourceExternalId);
    return ALL_SOURCE_DATA[sourceExternalId].quantity;
  }

  function getPrice(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].price;
  }

  function getTotalPrice(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].totalprice;
  }

  function getCustomer(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].customer;
  }

  function getEndUser(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].enduser;
  }

  function getDate(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].date;
  }

  function getRevRecStartDate(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].revrecstartdate;
  }

  function getRevRecEndDate(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].revrecenddate;
  }

  function getExchangeRate(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].exchangerate;
  }

  function getSFdealId(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].sfdealid;
  }

  function getBaseSSP(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].basessp;
  }

  function getPartDisc(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].partnerdiscount;
  }

  function getProrationFactor(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].prorationfactor;
  }

  function getTierMult(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].tiermultiplier;
  }

  function getDiscTierMult(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].disctiermultiplier;
  }

  function getBlockPriceMult(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].blockpricemultiplier;
  }

  function getTierMultDesc(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].tiermultdesc;
  }

  function getDiscTierDesc(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].disctierdesc;
  }

  function getBlockTierDesc(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].blocktierdesc;
  }

  function getThirdPtyCommRate(sourceExternalId) {
    return ALL_SOURCE_DATA[sourceExternalId].thirdptycommrate;
  }

  function getSourceIdFromSourceExternalId(sourceExternalId) {

    return SOURCE_EXTERNAL_ID_TO_SOURCE_ID[sourceExternalId];
  }

  function notifyRevenueElementCreated(context) {
    var revenueElementId = context.input.revenueElement.revenueElementId;
    log.audit("Revenue Element created: ", revenueElementId);
  }

  function isEmpty(stValue) {
    return (
        stValue === "" ||
        stValue == null ||
        false ||
        (stValue.constructor === Array && stValue.length == 0) ||
        (stValue.constructor === Object &&
            (function (v) {
              for (var k in v) return false;
              return true;
            })(stValue))
    );
  }

  function getTs() {
    return ts;
  }

  return {
    getSourceRecordType: getSourceRecordType,
    getSourceExternalIdsForRevenueElementUpdate: getSourceExternalIdsForRevenueElementUpdate,
    getSourceExternalIdsForRevenueElementCreation: getSourceExternalIdsForRevenueElementCreation,
    getRevRecStartDate: getRevRecStartDate,
    getRevRecEndDate: getRevRecEndDate,
    getOrder: getOrder,
    getArrangementKey: getArrangementKey,
    getSubsidiary: getSubsidiary,
    getLocation: getLocation,
    getDepartment: getDepartment,
    getClassification: getClassification,
    getCurrency: getCurrency,
    getAccountingBook: getAccountingBook,
    getItem: getItem,
    getQuantity: getQuantity,
    getPrice: getPrice,
    getTotalPrice: getTotalPrice,
    getCustomer: getCustomer,
    getEndUser: getEndUser,
    getDate: getDate,
    getExchangeRate: getExchangeRate,
    getSFdealId: getSFdealId,
    getBaseSSP: getBaseSSP,
    getPartDisc: getPartDisc,
    getProrationFactor: getProrationFactor,
    getTierMult: getTierMult,
    getDiscTierMult: getDiscTierMult,
    getBlockPriceMult: getBlockPriceMult,
    getTierMultDesc: getTierMultDesc,
    getDiscTierDesc: getDiscTierDesc,
    getBlockTierDesc: getBlockTierDesc,
    getThirdPtyCommRate: getThirdPtyCommRate,
    getSourceIdFromSourceExternalId: getSourceIdFromSourceExternalId,
    notifyRevenueElementCreated: notifyRevenueElementCreated,
    getTs: getTs,
  };
});
