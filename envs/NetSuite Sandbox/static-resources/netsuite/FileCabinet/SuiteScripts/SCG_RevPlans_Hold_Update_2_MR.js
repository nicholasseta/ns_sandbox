/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *
 * Version  Date            Author           Remark
 * 1.00     23 Sep 2022     Doug Humberd     Removes Revenue Plans from Hold (Unchecks)
 *
 */
define(['N/search','N/record', 'N/runtime'], function(search,record, runtime) {

    function getInputData() {
        log.debug('START','Set Search');
        //Set search for recent customer changes to Taxable, Terms, Shipping Address, or Billing Address
        var searchId = runtime.getCurrentScript().getParameter("custscript_scg_rphu_savedsearch_id");
        log.debug('Saved Search ID', searchId);
        var result = search.load({
            id: searchId
        });
        return result;
    }

    function map(context) {
        log.debug('context', context);
        //context.write({
            //key: JSON.parse(context.value).values["GROUP(internalid)"].value, // + '-' + JSON.parse(context.value).values.type.text.replace(/\s+/g, '').toLowerCase(), //salesorder id as key
            //value: JSON.parse(context.value).values["MAX(formulatext)"] + ',,,' +
                //JSON.parse(context.value).values["GROUP(formulatext)"] + ',,,' +
                //JSON.parse(context.value).values["GROUP(shipaddress)"] + ',,,' +
                //JSON.parse(context.value).values["GROUP(addressinternalid.shippingAddress)"] + ',,,' +
                //JSON.parse(context.value).values["GROUP(billaddress)"] + ',,,' +
                //JSON.parse(context.value).values["GROUP(addressinternalid.billingAddress)"] + ',,,' +
                //JSON.parse(context.value).values["GROUP(field.systemNotes)"].text + ',,,' +
                //JSON.parse(context.value).values["GROUP(oldvalue.systemNotes)"]
        //});

        //var searchResult = JSON.parse(context.value);
        var searchResult = JSON.parse(context.value).values["GROUP(internalid)"].value
        //log.debug('searchResult', searchResult);
        context.write({
            key: searchResult.id,
            //value: searchResult.internalid.revenueArrangement
        });

        log.debug('SCG_RevPlans_Hold_Update_2_MR', 'START');

        //var rpId = searchResult.id;
        var rpId = searchResult;
        //log.debug('Sales Order ID', searchResult.id);
        log.debug('Revenue Plan ID', rpId);

        //Load the Revenue Plan Record
        var rpRec = record.load({
            type: record.Type.REVENUE_PLAN,
            id: rpId,
            isDynamic: false,
        });
        
        
        rpRec.setValue({
            fieldId: 'holdrevenuerecognition',
            value: false,
            ignoreFieldChange: true
        });

        
        
        
        //Get Script Parameters
        //var fieldToUpdate = runtime.getCurrentScript().getParameter("custscript_scg_raau_field_to_update");
        //var acctLookFor = runtime.getCurrentScript().getParameter("custscript_scg_raau_acct_look_for");
        //var chgToAcct = runtime.getCurrentScript().getParameter("custscript_scg_raau_acct_chg_to");
        //log.debug('Field to Update', fieldToUpdate);
        //log.debug('Account to Look For', acctLookFor);
        //log.debug('Change to Acccount', chgToAcct);

        //if (isEmpty(fieldToUpdate) || isEmpty(acctLookFor) || isEmpty(chgToAcct)){
            //log.debug('MISSING SCRIPT PARAMETERS', 'EXIT');
            //return;
        //}

        //lineCount = rpRec.getLineCount({
            //sublistId: 'revenueelement'
        //});
        //log.debug('Line Count on Revenue Arrangement Record', lineCount);

        //for (var z = 0; z < lineCount; z++){

            //var currentAcctValue = rpRec.getSublistValue({
                //sublistId: 'revenueelement',
                //fieldId: fieldToUpdate,
                //line: z
            //});

            //if (currentAcctValue == acctLookFor){

                //log.debug('Account Value Found on Line ' + z, 'Change Account to ' + chgToAcct);

                //rpRec.setSublistValue({
                    //sublistId: 'revenueelement',
                    //fieldId: fieldToUpdate,
                    //line: z,
                    //value: chgToAcct
                //});

            //}

        //}//End for z loop

        //Save the Revenue Plan Record
        var revPlanId = rpRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });

    }

    function reduce(context) {

    };

    function summarize(summary) {

        handleErrors(summary);
        handleSummaryOutput(summary.output);
        // *********** HELPER FUNCTIONS ***********
        function handleErrors(summary) {
            var errorsArray = getErrorsArray(summary);
            if (!errorsArray || !errorsArray.length) {
                log.debug('No errors encountered');
                return;
            }
            for (var i in errorsArray) {
                log.error('Error ' + i, errorsArray[i]);
            }
            if (errorsArray && errorsArray.length) {
                //
                // INSERT YOUR CODE HERE
                //
            }
            return errorsArray;
            // *********** HELPER FUNCTIONS ***********
            function getErrorsArray(summary) {
                var errorsArray = [];
                if (summary.inputSummary.error) {
                    log.audit('Input Error', summary.inputSummary.error);
                    errorsArray.push('Input Error | MSG: ' + summary.inputSummary.error);
                }
                summary.mapSummary.errors.iterator().each(
                    function (key, e) {
                        var errorString = getErrorString(e);
                        log.audit('Map Error', 'KEY: ' + key + ' | ERROR: ' + errorString);
                        errorsArray.push('Map Error | KEY: ' + key + ' | ERROR: ' + errorString);
                        return true; // Must return true to keep
                        // looping
                    });
                summary.reduceSummary.errors.iterator().each(
                    function (key, e) {
                        var errorString = getErrorString(e);
                        log.audit('Reduce Error', 'KEY: ' + key + ' | MSG: ' + errorString);
                        errorsArray.push('Reduce Error | KEY: ' + key + ' | MSG: ' + errorString);
                        //						UpdateStatus(key, 3, errorString);
                        return true; // Must return true to keep
                        // looping
                    });
                return errorsArray;
                // *********** HELPER FUNCTIONS ***********
                function getErrorString(e) {
                    var errorString = '';
                    var errorObj = JSON.parse(e);
                    if (errorObj.type == 'error.SuiteScriptError' || errorObj.type == 'error.UserEventError') {
                        errorString = errorObj.name + ': ' + errorObj.message;
                    } else {
                        errorString = e;
                    }
                    return errorString;
                }
            }
        }
        function handleSummaryOutput(output) {
            var contents = '';
            output.iterator().each(function (key, value) {
                contents += (key + ' ' + value + '\n');
                return true;
            });
            if (contents) {
                log.debug('output', contents);
            }
        }

    };


    function isEmpty(stValue)
    {
        if ((stValue == '') || (stValue == null) ||(stValue == undefined))
        {
            return true;
        }

        return false;
    }


    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    }
});