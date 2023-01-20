/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     18 Jan 2022     Doug Humberd     Checks 'Create Revenue Event (Trigger Plan)' on Order Product so that 'SCG | UE | Forcast Plan' will trigger'
 * 
 */
define(['N/record', 'N/render', 'N/search', 'N/runtime', 'N/https', 'N/format', 'N/redirect'],
/**
 * @param {record} record
 * @param {render} render
 * @param {search} search
 */
function(record, render, search, runtime, https, format, redirect) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	
    	//Get Parameters
    	var scriptObj = runtime.getCurrentScript();
    	log.debug(scriptObj);
    	
    	var opId = context.request.parameters.ordprodid;
    	log.debug('Order Product Id', opId);
    	
    	var projId = context.request.parameters.projid;
    	log.debug('Project Id', projId);
    	
    	
    	//Update the Order Product Record so that User Event Scripts will trigger
    	var ordProdId = record.submitFields({
		    type: 'customrecord_contractlines',
		    id: opId,
		    values: {
		        'custrecord_is_cl_create_forecast_plan': true
		    }
		});
    	
    	
    	//Redirect back to the project record
    	redirect.toRecord({
		    type: record.Type.JOB,
		    id: projId
		});
    	

    }
    
    
    
    function isEmpty(stValue)
    { 
        if ((stValue == '') || (stValue == null) ||(stValue == undefined))
        {
            return true;
        }
        
        return false;
    }  
    
    

    return {
        onRequest: onRequest
    };
    
});
