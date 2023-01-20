/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Version  Date            Author           Remark
 * 1.00     Unknown         Greg DelVecchio  Original Version
 * 1.05     18 Jan 2022     Doug Humberd     Updated to set Cumulative Percent Complete and Event Date Values on Revenue Events
 * 1.10     21 Oct 2022     Doug Humberd     Updated to get the Create Revenue Plans On value from the Revenue Element (if exists), else from the Item (existing logic)
 *
 */
define(['N/record', 'N/runtime', 'N/search'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    (record, runtime, search) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            createForecastPlan(scriptContext);
        }

        return {beforeLoad, beforeSubmit, afterSubmit}


        /**
         * Creates Forecast and Actual Revenue Event records for Order Product records
         * @param {Object} scriptContext
         */
        function createForecastPlan(context) {
            // Only run on Create and Edit
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.XEDIT) {
                return;
            }

            // Get the Order Product record
            var newRecord = context.newRecord;
            var internalId = newRecord.getValue({fieldId: 'id'});
            // When event type is XEDIT then load full record
            if (context.type === context.UserEventType.XEDIT) {
                newRecord = record.load({
                    type: 'customrecord_contractlines',
                    id: internalId
                });
            }
            var createForecastPlan = newRecord.getValue({
                fieldId: 'custrecord_is_cl_create_forecast_plan'
            });
            log.audit('internalId/createForecastPlan', internalId + '/' + createForecastPlan);

            // Create Revenue Events when Create Forecast Plan is true
            if (createForecastPlan == true) {
                // Get field values
                var contractLineAmount = newRecord.getValue({fieldId: 'custrecord_is_cl_totalprice'});
                var itemId = newRecord.getValue({fieldId: 'custrecord_is_cl_item'});
                log.debug('itemId', itemId);

                var revElement = newRecord.getValue({fieldId: 'custrecord_is_cl_revenue_element'});
                log.debug('revElement', revElement);

                //If there is a Revenue Element, get the created revenue plans on value from there, else from the item
                if (isEmpty(revElement)){

                    var itemObj = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ['createrevenueplanson']
                    });
                    log.debug('itemObj', itemObj);
                    var createRevenuePlansOn = itemObj.createrevenueplanson[0].value;
                    log.debug('createRevenuePlansOn', createRevenuePlansOn);

                }else{

                    var revElmtObj = search.lookupFields({
                        type: 'revenueelement',
                        id: revElement,
                        columns: ['createrevenueplanson']
                    });
                    log.debug('revElmtObj', revElmtObj);
                    var createRevenuePlansOn = revElmtObj.createrevenueplanson[0].value;
                    log.debug('createRevenuePlansOn', createRevenuePlansOn);

                }//End if (!isEmpty(revElement))



                var cumulativePercentComplete = newRecord.getValue({fieldId: 'custrecord_cumulative_percent_complete'});
                cumulativePercentComplete = Number(cumulativePercentComplete);
                var percentCompleteDate = newRecord.getValue({fieldId: 'custrecord_percent_complete_date'});
                log.debug('Cumulative Percent Complete: ' + cumulativePercentComplete, 'Percent Complete Date: ' + percentCompleteDate);

                // Create the Forecast Revenue Event
                var forecastEvent = record.create({
                    type: record.Type.BILLING_REVENUE_EVENT
                });
                forecastEvent.setValue({fieldId: 'customform', value: 14});
                forecastEvent.setValue({fieldId: 'recordtype', value: 347});
                forecastEvent.setValue({fieldId: 'record', value: internalId});
                forecastEvent.setValue({fieldId: 'eventtype', value: createRevenuePlansOn});
                forecastEvent.setValue({fieldId: 'eventdate', value: new Date()});
                forecastEvent.setValue({fieldId: 'eventpurpose', value: 'FORECAST'});

                if (createRevenuePlansOn == '1' || createRevenuePlansOn == '5') {
                    forecastEvent.setValue({fieldId: 'amount', value: contractLineAmount});
                }
                if (createRevenuePlansOn == '4') {
                    //forecastEvent.setValue({fieldId: 'cumulativepercentcomplete', value: 1});
                    forecastEvent.setValue({fieldId: 'cumulativepercentcomplete', value: cumulativePercentComplete});
                    forecastEvent.setValue({fieldId: 'eventdate', value: percentCompleteDate});
                }
                var forecastEventId = forecastEvent.save();
                log.debug('forecastEventId', forecastEventId);

                // Create the Actual Revenue Event
                var actualEvent = record.create({
                    type: record.Type.BILLING_REVENUE_EVENT
                });
                actualEvent.setValue({fieldId: 'customform', value: 14});
                actualEvent.setValue({fieldId: 'recordtype', value: 347});
                actualEvent.setValue({fieldId: 'record', value: internalId});
                actualEvent.setValue({fieldId: 'eventtype', value: createRevenuePlansOn});
                actualEvent.setValue({fieldId: 'eventdate', value: new Date()});
                actualEvent.setValue({fieldId: 'eventpurpose', value: 'ACTUAL'});

                if (createRevenuePlansOn == '1' || createRevenuePlansOn == '5') {
                    actualEvent.setValue({fieldId: 'amount', value: contractLineAmount});
                }
                if (createRevenuePlansOn == '4') {
                    //actualEvent.setValue({fieldId: 'cumulativepercentcomplete', value: 1});
                    actualEvent.setValue({fieldId: 'cumulativepercentcomplete', value: cumulativePercentComplete});
                    actualEvent.setValue({fieldId: 'eventdate', value: percentCompleteDate});
                }

                var actualEventId = actualEvent.save();
                log.debug('actualEventId', actualEventId);

                // Unset the Create Forecast Plan checkbox
                var setCreateForecastPlan = record.submitFields({
                    type: 'customrecord_contractlines',
                    id: internalId,
                    values: {
                        'custrecord_is_cl_create_forecast_plan': false
                        //'custrecord_is_cl_forecast_plan': actualEventId
                    }
                });
            }

            return;
        }


        function isEmpty(stValue)
        {
            if ((stValue == '') || (stValue == null) ||(stValue == undefined))
            {
                return true;
            }

            return false;
        }


    });