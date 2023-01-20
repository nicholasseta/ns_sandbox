/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     14 Jan 2022     Doug Humberd     Handles User Events on Project Records
 *                          Doug Humberd     Added 'is_proj_createRevEventTrigger'
 * 1.05     18 Jan 2022     Doug Humberd     Updated 'is_proj_createRevEventTrigger' with a redirect to suitelet so that existing UE scripts will trigger when the Order Product is updated
 * 1.06		10 Oct 2022		Greg DelVecchio	 Changed the redirect to the Rev Event Suitelet to an https.get call so that it works for all execution contexts
 * 1.07     20 Oct 2022     Doug Humberd     Updated to only trigger SL based on Create Revenue Plans On values (either on Order Project or on Revenue Element records)
 *  
 * 
 */
define(['N/record', 'N/search', 'N/format', 'N/redirect', 'N/runtime', 'N/url', 'N/https'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, format, redirect, runtime, url, https) {

	const CREATE_PLANS_ON_PROJ_PROG = 4;//Create Revenue Plans On: Third Party Source Rev Rec Event Type - Project Progress
	const CREATE_PLANS_ON_PROJ_PROG_OLD = 2;//Create Revenue Plans On: Third Party Source Rev Rec Event Type - Project Progress (old)
	const PROJ_PROGRESS = '-4';//Create Revenue Plans On: Project Progress

	/**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {
    	
    	try{
    		is_proj_createRevEventTrigger(context);
    	}catch(e){
    		is_proj_logError(e);
    	}

    }
    
    
/**
 * Triggers creation of Revenue Event when PCO or Last Rev Rec Date changes on the Project record
 * @name is_proj_createRevEventTrigger
 */
    function is_proj_createRevEventTrigger(context){
    	//Run on Edit
		log.debug('createRevEventTrigger', 'START');
		log.debug('Execution Type', context.type);
		log.debug('Execution Context', runtime.executionContext);
    	if (context.type != 'edit'){
    		return;
    	}
    	
    	// Get new and old Project records
    	var projRec = context.newRecord;
		var oldProjRec = context.oldRecord;
    	var projId = projRec.id;
    	log.debug('Project ID', projId);
    	
    	// Get new field values
    	var oa_pco = projRec.getValue({
			fieldId: 'custentity_openair_pco_custom'
		});
    	var oa_lastRRdate = projRec.getValue({
			fieldId: 'custentity_openair_last_rev_rec_date_cus'
		});

    	// Get old field values
    	var old_oa_pco = oldProjRec.getValue({
			fieldId: 'custentity_openair_pco_custom'
		});
    	var old_oa_lastRRdate = oldProjRec.getValue({
			fieldId: 'custentity_openair_last_rev_rec_date_cus'
		});

    	// Compare new and old field values
		var lastRRdate;
    	var oldLastRRdate;
    	
    	if (!isEmpty(oa_lastRRdate)){
    		lastRRdate = format.format({value: oa_lastRRdate, type: format.Type.DATE});
    	}
    	if (!isEmpty(old_oa_lastRRdate)){
    		oldLastRRdate = format.format({value: old_oa_lastRRdate, type: format.Type.DATE});
    	}
    	log.debug('Old OpenAir PCO: ' + old_oa_pco, 'OpenAir PCO: ' + oa_pco);
    	log.debug('Old OA Last Rev Rec Date: ' + oldLastRRdate, 'OA Rev Rec Date: ' + lastRRdate);
    	
    	//Only continue if either 'OpenAir: PCO (Custom)' or 'OpenAir: Last Rev Rec Date (custom)' has changed
    	if (oa_pco == old_oa_pco && lastRRdate == oldLastRRdate){
    		log.debug('Neither OA Field was Changed', 'EXIT');
    		return;
    	}
    	
    	// Search for Order Product records related to the Project
    	var searchresults = search.create({
			type:'customrecord_contractlines',
			columns: [
				search.createColumn({
					name: 'internalid'
				})
			],
			filters: [
				['custrecord_is_cl_job', 'anyof', projId]
			]
		});

		// Run the search
		var result = searchresults.run();
    	var resultRange = result.getRange({
	        start: 0,
	        end: 1000
	    });
		var resultLength = resultRange.length;
		log.debug('Search Result Length', resultLength);

		if (resultLength == 0){
			log.debug('No Order Product Records found for project ' + projId, 'EXIT');
			return;
		}

		// Loop through the search results
		var opId;
		for (var i = 0; resultLength > 0 && i < resultLength; i++){
			opId = resultRange[i].getValue({
				name: 'internalid'
			});
			log.debug('Order Product ID result ' + i, opId);

			// Write the updated field values to the Order Product record
			record.submitFields({
				type: 'customrecord_contractlines',
				id: opId,
				values: {
					'custrecord_cumulative_percent_complete' : oa_pco,
					'custrecord_percent_complete_date' : oa_lastRRdate
				}
			});


			//Determine if the Suitelet needs to be triggered for Revenue Event creation
			var triggerSL = 'N';

			var ordProdFields = search.lookupFields({
				type: 'customrecord_contractlines',
				id: opId,
				columns: ['custrecord_is_cl_revenue_element', 'custrecord_create_plans_on']
			});
			log.debug('Order Product Fields', ordProdFields);

			var revElement = '';
			if (!isEmpty(ordProdFields.custrecord_is_cl_revenue_element)){
				revElement = ordProdFields.custrecord_is_cl_revenue_element[0].value;
			}
			log.debug('Revenue Element from Order Product', revElement);


			if (!isEmpty(revElement)){

				var revElmtFields = search.lookupFields({
					type: 'revenueelement',
					id: revElement,
					columns: ['createrevenueplanson']
				});
				log.debug('Revenue Element Fields', revElmtFields);

				var reCreatePlansOn = '';
				if (!isEmpty(revElmtFields.createrevenueplanson)){
					reCreatePlansOn = revElmtFields.createrevenueplanson[0].value;
				}
				log.debug('Create Revenue Plans On from Revenue Element', reCreatePlansOn);

				if (reCreatePlansOn == CREATE_PLANS_ON_PROJ_PROG || reCreatePlansOn == CREATE_PLANS_ON_PROJ_PROG_OLD || reCreatePlansOn == PROJ_PROGRESS){
					triggerSL = 'Y';
				}

			}else{

				var opCreatePlansOn = '';
				if (!isEmpty(ordProdFields.custrecord_create_plans_on)){
					opCreatePlansOn = ordProdFields.custrecord_create_plans_on[0].value;
				}
				log.debug('Create Plans On from Order Product', opCreatePlansOn);

				if (opCreatePlansOn == CREATE_PLANS_ON_PROJ_PROG || opCreatePlansOn == CREATE_PLANS_ON_PROJ_PROG_OLD || reCreatePlansOn == PROJ_PROGRESS){
					triggerSL = 'Y';
				}

			}


			/**
			//Redirect to Suitelet to check 'Create Revenue Element (Trigger Plan)'
			//so that the SCG | UE | Forcast Plan script triggers
			if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
				log.debug('Suitelet Redirect (UI)', runtime.executionContext);
				redirect.toSuitelet({
					scriptId: 'customscript_scg_createrevevt_2_sl' ,
					deploymentId: 'customdeploy_scg_createrevevt_2_sl',
					parameters: {
						'ordprodid' : opId,
						'projid' : projId
					}
				});
			} else {
				log.debug('Suitelet GET (Non-UI)', runtime.executionContext);
			*/

			//Do Not Trigger SL if triggerSL = N
			if (triggerSL == 'N'){
				log.debug('Trigger SL = N', 'CONTINUE TO NEXT SEARCH RESULT');
				continue;
			}

			// Call Suitelet via https.get rather than redirect so that it works for all execution contexts
			log.debug('Call Suitelet', runtime.executionContext);
			var suiteletUrl = url.resolveScript({
				scriptId: 'customscript_scg_createrevevt_2_sl' ,
				deploymentId: 'customdeploy_scg_createrevevt_2_sl',
				params: {
					'ordprodid' : opId,
					'projid' : projId
				},
				returnExternalUrl: true
			});
			var headerObj = {
				name: 'Accept-Language',
				value: 'en-us'
			};
			var response = https.get({
				url: suiteletUrl,
				headers: headerObj
			});
			/**
			}
			 */
		}//End for i loop
		
    	log.debug('createRevEventTrigger', 'END');
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
        //beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord customer
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_proj_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}
