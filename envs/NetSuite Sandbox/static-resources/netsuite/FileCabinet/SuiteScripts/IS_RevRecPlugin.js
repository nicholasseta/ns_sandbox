/**
 * @NApiVersion 2.0
 * @NScriptType AdvancedRevRecPlugin
 */
define([
  "N/search",
  "N/record",
  "N/email",
  "N/runtime",
  "N/error",
  "N/format",
  "/SuiteScripts/IS_RevRecPlugin_Lib.js",
  "N/query",
], function (search, record, email, runtime, error, format, lib, query) {
  function getRevenueElementSourceIdsForCreation(context) {
    log.audit(lib.getTs() + " getRevenueElementSourceIdsForCreation: Entry", context);

    var sourceIds = [];
    var sourceExternalIdsForCreation = lib.getSourceExternalIdsForRevenueElementCreation();
    var scriptObj = runtime.getCurrentScript();

    log.debug("sourceExternalIdsForCreation-Returned: ", sourceExternalIdsForCreation);
    log.debug("sourceExternalIdsForCreation-Length: ", sourceExternalIdsForCreation.length);

    for (var i = 0, len = sourceExternalIdsForCreation.length; i < len; i++) {

        log.debug("sourceExternalIdsForCreation[i]: ", sourceExternalIdsForCreation[i]);
        var id = lib.getSourceIdFromSourceExternalId(sourceExternalIdsForCreation[i])
        log.debug(lib.getTs() + " getRevenueElementSourceIdsForCreation: id", id);
        sourceIds.push(id)


    }

      log.debug(lib.getTs() + " getRevenueElementSourceIdsForCreation: sourceIds", sourceIds);

      context.output.ids = sourceIds;


    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " getRevenueElementSourceIdsForCreation: Exit", context);

    return true;
  }

  function getRevenueElementsForSourceId(context) {
    log.audit(lib.getTs() + " getRevenueElementsForSourceId: Entry", context);

    var revenueElements = [];



      var sql =
          "SELECT " +
          "customrecord_contractlines.* " +
          "FROM customrecord_contractlines " +
          "WHERE customrecord_contractlines.\"ID\" = " + context.input.id;


      var resultSet = query.runSuiteQL({ query: sql }).asMappedResults();

      log.debug(lib.getTs() + " getRevenueElementsForSourceId: resultSet", resultSet);


     if (resultSet[0] != null) {

         var customer = resultSet[0].custrecord_is_cl_customer;

         var project = resultSet[0].custrecord_is_cl_job;
         if (project) {
             customer = project;
         }

         revenueElements.push(
             context.output.createRevenueElement({
                 sourceId: context.input.id,
                 accountingBook: resultSet[0].custrecord_is_cl_acct_book,
                 subsidiary: resultSet[0].custrecord_is_cl_subsidiary,
                 currency: resultSet[0].custrecord_is_cl_currency,
                 item: resultSet[0].custrecord_is_cl_item,
                 quantity: resultSet[0].custrecord_is_cl_quantity,
                 salesAmount: resultSet[0].custrecord_is_cl_quantity * resultSet[0].custrecord_is_cl_price,
                 discountedSalesAmount: resultSet[0].custrecord_is_cl_quantity * resultSet[0].custrecord_is_cl_price,
                 elementDate: resultSet[0].custrecord_is_cl_date,
                 entity: customer,
                 endUser: resultSet[0].custrecord_op_end_user,
                 startDate: resultSet[0].custrecord_is_revrec_startdate,
                 endDate: resultSet[0].custrecord_is_revrec_enddate,
                 forecaststartdate: resultSet[0].custrecord_is_revrec_startdate,
                 forecastendDate: resultSet[0].custrecord_is_revrec_enddate,
                 location: resultSet[0].custrecord_is_cl_location,
                 department: resultSet[0].custrecord_op_department,
                 exchangeRate: resultSet[0].custrecord_is_cl_exchangerate,
                 sfDealId: resultSet[0].custrecord_is_cl_sf_deal_id,
                 baseSSP: resultSet[0].custrecord_is_cl_base_ssp,
                 partDisc: resultSet[0].custrecord_op_partner_disc_percent,
                 prorationFactor: resultSet[0].custrecord_is_cl_proration_factor,
                 tierMult: resultSet[0].custrecord_is_cl_tier_multiplier,
                 discTierMult: resultSet[0].custrecord_is_cl_disc_tier_mult,
                 blockPriceMult: resultSet[0].custrecord_is_cl_block_mult,
                 tierMultDesc: resultSet[0].custrecord_is_cl_tier_multiplier_desc,
                 discTierDesc: resultSet[0].custrecord_is_cl_discount_tier_desc,
                 blockTierDesc: resultSet[0].custrecord_is_cl_block_tier_desc,
                 classification: resultSet[0].custrecord_op_erp,
                 thirdPtyCommRate: resultSet[0].custrecord_op_jv_resellrate,
             })
         );


    }

      log.debug(lib.getTs() + " getRevenueElementsForSourceId: revenueElements", revenueElements);
      context.output.revenueElements = revenueElements;

    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " getRevenueElementsForSourceId: Exit", context);

    return true;
  }

  function getRevenueArrangementGroupForSourceId(context) {
    log.audit(lib.getTs() + " getRevenueArrangementGroupForSourceId: Entry", context);

    try {
      var custSourceRecord = record.load({
        type: lib.getSourceRecordType(),
        id: context.input.id,
      });
      var orderId = custSourceRecord.getValue({
        fieldId: "custrecord_is_cl_order",
      });
      log.debug("rev arrangement group order ID: ", orderId);
      context.output.id = orderId;

      var scriptObj = runtime.getCurrentScript();
      log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    } catch (e) {
      log.error({
        title: "ERROR GETTING ARRANGEMENT GROUPING",
        details: e,
      });
    }

    var uncheckCreateNewElement = record.submitFields({
      type: "customrecord_contractlines",
      id: context.input.id,
      values: {
        custrecord_is_new_ext_id: false,
        custrecord_is_update_rev_element: false,
      },
    });
    log.debug("uncheckCreateNewElement", uncheckCreateNewElement);

    var newExtId = custSourceRecord.getValue("custrecord_is_new_ext_id");
    log.debug("newExtId", newExtId);
    log.audit(lib.getTs() + " getRevenueArrangementGroupForSourceId: Exit", context);
  }

  function getSourceRecordType(context) {
    log.audit(lib.getTs() + " getSourceRecordType: Entry", context);

    context.output.sourceRecordType = lib.getSourceRecordType();

    log.audit("getSourceRecordType: Exit", context);

    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " getSourceRecordType: Exit", context);
  }

  function onRevenueElementCreated(context) {
    log.audit(lib.getTs() + " onRevenueElementCreated: Entry", context);

    var revenueElementID = context.input.revenueElement.revenueElementId;

    var setRevenueElement = record.submitFields({
      type: "customrecord_contractlines",
      id: context.input.revenueElement.sourceId,
      values: {
        custrecord_is_cl_revenue_element: revenueElementID,
      },
    });
    log.debug("setRevenueElement", setRevenueElement);

    lib.notifyRevenueElementCreated(context);

    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " onRevenueElementCreated: Exit", context);
  }

  function getRevenueElementSourceIdsForUpdate(context) {
    log.audit(lib.getTs() + " getRevenueElementSourceIdsForUpdate: Entry", context);

    var sourceIds = [];
    var sourceExternalIdsForUpdate = lib.getSourceExternalIdsForRevenueElementUpdate();
    for (var i = 0, len = sourceExternalIdsForUpdate.length; i < len; i++) {
        var id = lib.getSourceIdFromSourceExternalId(sourceExternalIdsForUpdate[i])
        log.debug(lib.getTs() + " getRevenueElementSourceIdsForUpdate: ID", id);

        sourceIds.push(id);

    }
      log.debug(lib.getTs() + " getRevenueElementSourceIdsForUpdate: sourceIds", sourceIds);

      context.output.ids = sourceIds;

    log.audit("getRevenueElementSourceIdsForUpdate: Exit", context);

    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " getRevenueElementSourceIdsForUpdate: Exit", context);
  }

  function updateRevenueElement(context) {
    log.audit(lib.getTs() + " updateRevenueElement: Entry", context);

      var sql =
          "SELECT " +
          "customrecord_contractlines.* " +
          "FROM customrecord_contractlines " +
          "WHERE customrecord_contractlines.\"ID\" = " + context.output.revenueElement.sourceId;


      var resultSet = query.runSuiteQL({ query: sql }).asMappedResults();
      log.debug(lib.getTs() + " updateRevenueElement: resultSet", resultSet);


      if(!!resultSet[0]){

          context.output.revenueElement.quantity = resultSet[0].custrecord_is_cl_quantity;
          context.output.revenueElement.salesAmount = resultSet[0].custrecord_is_cl_totalprice;
          context.output.revenueElement.discountedSalesAmount = resultSet[0].custrecord_is_cl_totalprice;
          context.output.revenueElement.item = resultSet[0].custrecord_is_cl_item;
          context.output.revenueElement.department = resultSet[0].custrecord_op_department;
          context.output.revenueElement.classification = resultSet[0].custrecord_op_erp;
          context.output.revenueElement.location = resultSet[0].custrecord_is_cl_location;
          context.output.revenueElement.exchangeRate = resultSet[0].custrecord_is_cl_exchangerate;


          log.debug("DH context.output.revenueElement.sourceId", context.output.revenueElement.sourceId);
          var uncheckUpdateRevElement = record.submitFields({
              type: "customrecord_contractlines",
              id: context.output.revenueElement.sourceId,
              values: {
                  custrecord_is_update_rev_element: false,
              },
          });

          log.debug("uncheckUpdateRevElement", uncheckUpdateRevElement);

      }



    log.audit("updateRevenueElement: Exit", context);

    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " updateRevenueElement: Exit", context);
  }

  function getInvoiceLinksForSourceId(context) {
    log.audit(lib.getTs() + " getInvoiceLinksForSourceId: Entry", context);
    log.debug("sourceId", context.input.id);

    var invoiceLinks = [];

    if (context.input.id != null) {
      var sql =
          "SELECT" +
          "  l.transaction," +
          "  l.donotcreaterevenueelement," +
          "  l.uniquekey as uniqueKey," +
          "  (l.foreignamount * -1) as fxamount," +
          "  t.exchangerate as exchangerate," +
          "  l.custcol_reference_contractline " +
          "FROM" +
          "  TransactionLine l" +
          "  INNER JOIN Transaction t ON t.id = l.transaction " +
          "WHERE" +
          "  l.custcol_reference_contractline = " +
          context.input.id +
          "  and l.mainline = 'F'" +
          "  and l.donotcreaterevenueelement = 'T'";

      // return mapped transaction line results
      const tranlineRes = query.runSuiteQL({ query: sql }).asMappedResults();
      log.debug("invoiceSearchResultCount", tranlineRes);

        log.debug(lib.getTs() + " getInvoiceLinksForSourceId: tranlineRes", tranlineRes);


        tranlineRes.forEach(function (result) {
        invoiceLinks.push(
            context.output.createSourceToInvoiceTransactionLink({
              sourceId: context.input.id,
              transactionLine: result.uniquekey,
              fxAmount: result.fxamount,
              baseAmount: result.fxamount * result.exchangerate,
            })
        );
      });
    }

    context.output.sourceToInvoiceTransactionLinks = invoiceLinks;

    log.audit("getInvoiceLinksForSourceId: Exit", context);
    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " getInvoiceLinksForSourceId: Exit", context);
  }

  function getInvoiceLinksForInvoiceId(context) {
    log.audit(lib.getTs() + " getInvoiceLinksForInvoiceId: Entry", context);

    var invoiceLinks = [];

    // Construct the SuiteQL query string
    var sql =
        "SELECT" +
        "  l.transaction," +
        "  l.donotcreaterevenueelement," +
        "  l.uniquekey," +
        "  (l.foreignamount * -1) as fxamount," +
        "  t.exchangerate," +
        "  l.custcol_reference_contractline " +
        "FROM" +
        "  TransactionLine l" +
        "  INNER JOIN Transaction t ON t.id = l.transaction " +
        "WHERE" +
        "  t.id = " +
        context.input.id +
        "  and l.mainline = 'F'" +
        "  and l.donotcreaterevenueelement = 'T'";

    // Run the SuiteQL query as a paged query and return an iterator
    var resultIterator = query
        .runSuiteQLPaged({
          query: sql,
          pageSize: 1000,
        })
        .iterator();

    // Use the iterator to process each page of results
      log.debug(lib.getTs() + " getInvoiceLinksForInvoiceId: resultIterator", resultIterator);

      resultIterator.each(function (page) {
      var pageIterator = page.value.data.iterator();
      pageIterator.each(function (row) {
        log.debug("Do Not Create Revenue Element: " + row.value.getValue(1));
        invoiceLinks.push(
            context.output.createSourceToInvoiceTransactionLink({
              sourceId: row.value.getValue(5),
              transactionLine: row.value.getValue(2),
              fxAmount: row.value.getValue(3),
              baseAmount: row.value.getValue(3) * row.value.getValue(4),
            })
        );
        log.debug("getInvoiceLinksForInvoiceId", invoiceLinks.slice(-1)[0]);
        return true;
      });

      return true;
    });

    context.output.sourceToInvoiceTransactionLinks = invoiceLinks;

    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
    log.audit(lib.getTs() + " getInvoiceLinksForInvoiceId: Exit", context);
  }
  return {
    getRevenueElementSourceIdsForCreation: getRevenueElementSourceIdsForCreation,
    getRevenueElementsForSourceId: getRevenueElementsForSourceId,
    getRevenueArrangementGroupForSourceId: getRevenueArrangementGroupForSourceId,
    getSourceRecordType: getSourceRecordType,
    onRevenueElementCreated: onRevenueElementCreated,
    getRevenueElementSourceIdsForUpdate: getRevenueElementSourceIdsForUpdate,
    updateRevenueElement: updateRevenueElement,
    getInvoiceLinksForSourceId: getInvoiceLinksForSourceId,
    getInvoiceLinksForInvoiceId: getInvoiceLinksForInvoiceId,
  };
});
