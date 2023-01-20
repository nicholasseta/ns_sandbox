/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     17 Jun 2022     Doug Humberd     Handles User Events on Delete FAM Alternate Depreciation Custom Records
 *                          Doug Humberd     Deletes FAM Alternate Depreciation Records, and all dependent records
 *  
 * 
 */
define(['N/record', 'N/search', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime) {
	
	//const CONSTANT = '12345';//Record: Value
   
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
    		is_delfam_delete_fam_alt_dep_recs(context);
    	}catch(e){
    		is_delfam_logError(e);
    	}

    }
    
    
    
    
    
    
    function is_delfam_delete_fam_alt_dep_recs(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	try{
    		
    		log.debug('delete_fam_alt_dep_recs', 'START');
        	log.debug('Execution Type', context.type);
        	
        	var script = runtime.getCurrentScript();
        	var remUsage = script.getRemainingUsage();
        	log.debug('Remaining Governance', remUsage);
        	
        	var custRec = context.newRecord;
        	var custRecId = context.newRecord.id;
        	log.debug('Custom Record Id', custRecId);
        	
        	var delComplete = custRec.getValue({
    			fieldId: 'custrecord_scg_delfam_delete_complete'
    		});
        	log.debug('Deletion Complete', delComplete);
        	
        	
        	//Only run if Deletion Complete is not checked
        	if (delComplete == true){
        		log.debug('Deletion Complete Checked', 'EXIT');
        		return;
        	}
        	
        	
        	//Get values from Custom Record
        	var famAsset = custRec.getValue({
    			fieldId: 'custrecord_scg_delfam_fam_asset'
    		});
        	
        	var altMethod = custRec.getValue({
    			fieldId: 'custrecord_scg_delfam_alt_method'
    		});
        	
        	log.debug('FAM Asset: ' + famAsset, 'Alternate Method: ' + altMethod);
        	
        	//If either FAM Asset or Alternate Method is missing, Exit
        	if (isEmpty(famAsset) || isEmpty(altMethod)){
        		log.debug('Either FAM Asset or Alternate Method is Missing', 'EXIT');
        		return;
        	}
        	
        	
        	//***************************************************************************************************************
        	//*** DELETE FAM DEPRECIATION HISTORY *** DELETE FAM DEPRECIATION HISTORY *** DELETE FAM DEPRECIATION HISTORY *** 
        	//***************************************************************************************************************
        	
        	var dephistsearchresults = search.create({
    			type:'customrecord_ncfar_deprhistory',
    			columns: [
    		          search.createColumn({
    		        	  name: 'internalid',
    		        	  sort: search.Sort.ASC
    		          })
    			          ],
                filters: [
                    ['custrecord_deprhistaltmethod', 'anyof', altMethod], 
                    'AND', 
                    ['custrecord_deprhistasset', 'anyof', famAsset]
                ]
    		});
    		
    		var dephistresult = dephistsearchresults.run();
        	
    		var dephistresultRange = dephistresult.getRange({
    	        start: 0,
    	        end: 1000
    	    });
        	
    		var dephistResultLength = dephistresultRange.length;
    		log.debug('Depreciation History Search Result Length', dephistResultLength);
        	
    		if (dephistResultLength > 0){
    			
    			log.debug('Depreciation History Search Results Found', 'SUCCESS');
    			
    			for (var d = 0; d < dephistResultLength; d++){
              		
              		var depHistId = dephistresultRange[d].getValue({
                        name: 'internalid'
              		});
              		log.debug('Depreciation History ID from Result ' + d, depHistId);
              		
              		if (!isEmpty(depHistId)){
              		//if (!isEmpty(depHistId) && depHistId == '299168'){//TEMP CODE FOR TESTING
              			var deletedDepHistRec = record.delete({
              				type: 'customrecord_ncfar_deprhistory',
              				id: depHistId,
              			});
              		}
              		          		
              	}//End for d loop
    		
    		}else{
    			log.debug('Depreciation History Search Results Not Found', 'NO DEP HIST');
    		}
        	
        	
    		var remUsage = script.getRemainingUsage();
        	log.debug('Remaining Governance (After Depreciation History Deletes)', remUsage);
        	
        	
        	//*******************************************************************************************************************
        	//*** DELETE FAM ASSET VALUES *** DELETE FAM ASSET VALUES *** DELETE FAM ASSET VALUES *** DELETE FAM ASSET VALUES *** 
        	//*******************************************************************************************************************
        	
        	var assetvalsearchresults = search.create({
    			type:'customrecord_fam_assetvalues',
    			columns: [
    		          search.createColumn({
    		        	  name: 'internalid',
    		        	  sort: search.Sort.ASC
    		          })
    			          ],
                filters: [
                    ['custrecord_slaveparentasset', 'anyof', famAsset],
                    'AND', 
                    ['custrecord_slaveparenttax.custrecord_altdepraltmethod', 'anyof', altMethod]
                ]
    		});
    		
    		var assetvalresult = assetvalsearchresults.run();
        	
    		var assetvalresultRange = assetvalresult.getRange({
    	        start: 0,
    	        end: 1000
    	    });
        	
    		var assetvalResultLength = assetvalresultRange.length;
    		log.debug('FAM Asset Value Search Result Length', assetvalResultLength);
        	
    		if (assetvalResultLength > 0){
    			
    			log.debug('FAM Asset Value Search Results Found', 'SUCCESS');
    			
    			for (var x = 0; x < assetvalResultLength; x++){
              		
              		var assetValueId = assetvalresultRange[x].getValue({
                        name: 'internalid'
              		});
              		log.debug('FAM Asset Value ID from Result ' + x, assetValueId);
              		
              		if (!isEmpty(assetValueId)){
              		//if (!isEmpty(assetValueId) && assetValueId == '299168'){//TEMP CODE FOR TESTING
              			var deletedAssetValueRec = record.delete({
              				type: 'customrecord_fam_assetvalues',
              				id: assetValueId,
              			});
              		}
              		          		
              	}//End for x loop
    		
    		}else{
    			log.debug('FAM Asset Value Search Results Not Found', 'NO FAM ASSET VALUE');
    		}
        	
        	
    		var remUsage = script.getRemainingUsage();
        	log.debug('Remaining Governance (After FAM Asset Value Deletes)', remUsage);
        	
        	
        	//*********************************************************************************************************************
        	//*** DELETE FAM ALTERNATE DEPRECIATION *** DELETE FAM ALTERNATE DEPRECIATION *** DELETE FAM ALTERNATE DEPRECIATION *** 
        	//*********************************************************************************************************************
        	
        	var altdepsearchresults = search.create({
    			type:'customrecord_ncfar_altdepreciation',
    			columns: [
    		          search.createColumn({
    		        	  name: 'internalid',
    		        	  sort: search.Sort.ASC
    		          })
    			          ],
                filters: [
                    ['custrecord_altdeprasset', 'anyof', famAsset],
                    'AND', 
                    ['custrecord_altdepraltmethod', 'anyof', altMethod]
                ]
    		});
    		
    		var altdepresult = altdepsearchresults.run();
        	
    		var altdepresultRange = altdepresult.getRange({
    	        start: 0,
    	        end: 1000
    	    });
        	
    		var altdepResultLength = altdepresultRange.length;
    		log.debug('FAM Alternate Depreciation Search Result Length', altdepResultLength);
        	
    		if (altdepResultLength > 0){
    			
    			log.debug('FAM Alternate Depreciation Search Results Found', 'SUCCESS');
    			
    			for (var z = 0; z < altdepResultLength; z++){
              		
              		var altDepId = altdepresultRange[z].getValue({
                        name: 'internalid'
              		});
              		log.debug('FAM Alternate Depreciation ID from Result ' + z, altDepId);
              		
              		if (!isEmpty(altDepId)){
              		//if (!isEmpty(altDepId) && altDepId == '299168'){//TEMP CODE FOR TESTING
              			var deletedDepHistRec = record.delete({
              				type: 'customrecord_ncfar_altdepreciation',
              				id: altDepId,
              			});
              		}
              		          		
              	}//End for z loop
    		
    		}else{
    			log.debug('FAM Alternate Depreciation Search Results Not Found', 'NO FAM ALT DEP');
    		}
        	
        	
    		var remUsage = script.getRemainingUsage();
        	log.debug('Remaining Governance (After FAM Alternate Depreciation Deletes)', remUsage);

        	
        	//custRecId
        	//Check Deletion Complete on Custom Record
        	var delCustRecId = record.submitFields({
        	    type: 'customrecord_scg_del_fam_alt_dep_rec',
        	    id: custRecId,
        	    values: {
        	        'custrecord_scg_delfam_delete_complete': true
        	    }
        	});
    		
    	}catch(e){
    		is_delfam_logError(e);
    	}
    	
    	
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
function is_delfam_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



