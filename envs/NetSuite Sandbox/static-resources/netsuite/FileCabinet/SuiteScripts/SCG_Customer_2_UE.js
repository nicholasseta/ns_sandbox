/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     14 Oct 2020     Doug Humberd     Handles User Events on Customer Records
 *                          Doug Humberd     Updates various 'Hold' fields on associated projects
 * 1.05     22 Oct 2020     Doug Humberd     Updated 'Hold' logic with changes per Vicky 10-21-20 email
 * 1.10     09 Nov 2020     Doug Humberd     Added 'is_cus_setCustHealthScoreOnProjs' to set Customer Health Score on associated Project Records
 * 1.15     02 Aug 2021     Doug Humberd     Added 'is_cus_stmtLabelTranslation' 
 *  
 * 
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
	
	const CREDIT_SUPPORT_HOLD = '3';//Project Status: Credit/Support Hold (Accounting Lists) - VERIFY VALUE IN PROD
	const NEW_SERVICE_REQUEST = '25';//Project Status: New Service Request (Accounting Lists) - VERIFY VALUE IN PROD
	//ALSO VALIDATE PROJECT STATUS VALUES (below in 2 functions) IN PROD
   
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
    	
    	try{
    		is_cus_setCustHealthScoreOnProjs(context);
    		is_cus_stmtLabelTranslation(context);
    	}catch(e){
    		is_cus_logError(e);
    	}

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
    		is_cus_credit_support_holds(context);
    	}catch(e){
    		is_cus_logError(e);
    	}

    }
    
    
    
    
    
    function is_cus_credit_support_holds(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	log.debug('credit_support_holds', 'START');
    	log.debug('Execution Type', context.type);
    	
    	var custRec = context.newRecord;
    	var custId = custRec.id;
    	
    	var creditHold = custRec.getValue({
			fieldId: 'custentity_credit_hold'
		});
		var supportHold = custRec.getValue({
			fieldId: 'custentity_support_hold'
		});
		log.debug('Credit Hold: ' + creditHold, 'Support Hold: ' + supportHold);
    	
    	//Only run on Edit if either Credit Hold or Support Hold has changed
    	if (context.type == 'edit'){
    		
    		var oldCustRec = context.oldRecord;
    		
    		var oldCreditHold = oldCustRec.getValue({
    			fieldId: 'custentity_credit_hold'
    		});
    		var oldSupportHold = oldCustRec.getValue({
    			fieldId: 'custentity_support_hold'
    		});
    		log.debug('Old Credit Hold: ' + oldCreditHold, 'Old Support Hold: ' + oldSupportHold);
    		
    		if (oldCreditHold == creditHold && oldSupportHold == supportHold){
    			log.debug('No Change to Credit Hold or Support Hold', 'EXIT');
    			return;
    		}
    		
    	}//End if (context.type == 'edit')
    	
    	
    	
    	var projCount = 0;
    	
    	//Identity Projects to be Updated
    	var getProjectsSearch = search.create({
			type:'job',
			columns: ['internalid'],
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                [['customer', 'anyof', custId], 'OR', ['custentity_so_end_user_customer', 'anyof', custId]],
                'AND', 
                ['status', 'anyof', ['19', '2', '21', '20', '17']]//VALIDATE IN PRODUCTION
            ]
		});
		
		var result = getProjectsSearch.run();
    	
		if (!result){
			log.debug('Search Found No Projects for Customer ' + custId, 'EXIT');
			return;
		}
    	
		var resultRange = result.getRange({
	        start: 0,
	        end: 1000
	    });
		
		var resultLength = resultRange.length;
		log.debug('Result Length', resultLength);
    	
		for (var i = 0; i < resultRange.length; i++){
			
			var projId = resultRange[i].getValue({
	            name: 'internalid'
	        });
			
			log.debug('Project Internal ID', projId);
			
			
			var projFields = search.lookupFields({
			    type: search.Type.JOB,
			    id: projId,
			    //columns: ['entitystatus', 'custentity_scg_status_b4_hold', 'customer', 'custentity_so_end_user_customer']
			    columns: ['entitystatus', 'customer', 'custentity_so_end_user_customer']
			});
			log.debug('projFields', projFields);
			
			var projStatus = '';
			if (!isEmpty(projFields.entitystatus)){
				projStatus = projFields.entitystatus[0].value;
			}
			log.debug('Project Status', projStatus);
			
			var projCustomer = '';
			if (!isEmpty(projFields.customer)){
				projCustomer = projFields.customer[0].value;
			}
			log.debug('Project Customer', projCustomer);
			
			var projSOendUserCust = '';
			if (!isEmpty(projFields.custentity_so_end_user_customer)){
				projSOendUserCust = projFields.custentity_so_end_user_customer[0].value;
			}
			log.debug('Project SO End User Customer', projSOendUserCust);
			
			
			if (creditHold == true || supportHold == true){
				
				log.debug('Customer is On Hold', 'Update Appropriate Checkboxes and Statuses');
				
				if (projStatus != CREDIT_SUPPORT_HOLD){
					
					record.submitFields({
					    type: 'job',
					    id: projId,
					    values: {
					        'entitystatus': CREDIT_SUPPORT_HOLD
					    }
					});
					
				}
				
			}else{//Both Credit Hold and Support Hold are unchecked
				
				log.debug('Customer is NOT On Hold', 'Update Appropriate Checkboxes and Statuses');
				
				if (projStatus == CREDIT_SUPPORT_HOLD){
					
					record.submitFields({
					    type: 'job',
					    id: projId,
					    values: {
					        'entitystatus': NEW_SERVICE_REQUEST
					    }
					});
					
				}
				
			}
			
			
			var credHoldBillTo = false;
			var credHoldEndUser = false;
			var suppHoldBillTo = false;
			var suppHoldEndUser = false;
			

			if (creditHold == true){
				
				if (projCustomer == custId){
					credHoldBillTo = true;
				}
				
				if (projSOendUserCust == custId){
					credHoldEndUser = true;
				}
				
			}else{//creditHold == false
				
				if (projCustomer == custId){
					credHoldBillTo = false;
				}
				
				if (projSOendUserCust == custId){
					credHoldEndUser = false;
				}
				
			}//End if (creditHold == false)
			
			
			if (supportHold == true){
				
				if (projCustomer == custId){
					suppHoldBillTo = true;
				}
				
				if (projSOendUserCust == custId){
					suppHoldEndUser = true;
				}
				
			}else{//supportHold == false
				
				if (projCustomer == custId){
					suppHoldBillTo = false;
				}
				
				if (projSOendUserCust == custId){
					suppHoldEndUser = false;
				}
				
			}//End if (supportHold == false)
			
			
			
			record.submitFields({
			    type: 'job',
			    id: projId,
			    values: {
			        'custentity_credit_hold_bill_to': credHoldBillTo,
			        'custentity_credit_hold_end_user': credHoldEndUser,
			        'custentity_support_hold_bill_to': suppHoldBillTo,
			        'custentity_support_hold_end_user': suppHoldEndUser
			    }
			});
			
			
			
			projCount = Number(projCount) + 1;
			
		}//End for i loop
    	
		log.debug('Total Number of Projects Processed', projCount);
		
    	
    }
    
    
    
    
    
    function is_cus_setCustHealthScoreOnProjs(context){
    	
    	log.debug('START setCustHealthScoreOnProjs', 'Mode = ' + context.type);
    	
    	//Only Run on Edit
    	if (context.type != 'edit'){
    		return;
    	}
    	
    	var custRec = context.newRecord;
    	var custId = custRec.id;
    	
    	var oldCustRec = context.oldRecord;
    	
    	var custHealthScore = custRec.getValue({
			fieldId: 'custentity_customer_health_score_cu'
		});
    	
    	var oldCustHealthScore = oldCustRec.getValue({
			fieldId: 'custentity_customer_health_score_cu'
		});
		log.debug('Old Cust Health Score: ' + oldCustHealthScore, 'New Cust Health Score: ' + custHealthScore);
		
		if (custHealthScore != oldCustHealthScore){
			
			log.debug('Customer Health Score Changed', 'Update Project Records');
			
			var getProjectsSearch = search.create({
				type:'job',
				columns: ['internalid'],
	            filters: [
	                ['isinactive', 'is', 'F'],
	                'AND',
	                ['customer', 'anyof', custId],
	                'AND', 
	                ['status', 'anyof', ['25', '30', '28', '2']]//VALIDATE IN PRODUCTION (New Service Request, Service Ops, Scheduled, In Progress)
	            ]
			});
			
			var result = getProjectsSearch.run();
			//log.debug('getProjectsSearch Results', result);
	    	
			var resultRange = result.getRange({
		        start: 0,
		        end: 1000
		    });
			
			var resultLength = resultRange.length;
			log.debug('Result Length', resultLength);
	    	
			for (var i = 0; i < resultRange.length; i++){
				
				var projId = resultRange[i].getValue({
		            name: 'internalid'
		        });
				
				log.debug('Project Internal ID', projId);
				log.debug('Update Project ' + projId, 'Cust Health Score PR ' + custHealthScore);
				record.submitFields({
					type: 'job',
				    id: projId,
				    values: {
				    	'custentity_customer_health_score_pr' : custHealthScore
				    }
				});
				
			}//End for i loop
			
		}
    	
    }
    
    
    
    
    
    function is_cus_stmtLabelTranslation(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    	//if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('is_cus_stmtLabelTranslation', 'START');
    	
    	var custRec = context.newRecord;
    	var custId = custRec.id;
    	
    	//var custId = custRec.getValue({
    	    //fieldId: 'entity'
    	//});
    	log.debug('Customer ID', custId);
    	
    	//var custFields = search.lookupFields({
    	    //type: 'customer',
    	    //id: custId,
    	    //columns: ['language']
    	//});
    	//log.debug('Customer Fields', custFields);
    	
    	//var custLanguage = '';
    	//if (!isEmpty(custFields.language)){
    		//custLanguage = custFields.language[0].value;
    		//custLanguageTxt = custFields.language[0].text;
    	//}
    	
    	var custLanguage = custRec.getValue({
    	    fieldId: 'language'
    	});
    	
    	var custLanguageTxt = custRec.getText({
    	    fieldId: 'language'
    	});
    	
    	log.debug('Customer Language', custLanguage);
    	log.debug('Customer Language Text', custLanguageTxt);
    	
    	
    	//Get the Internal Id for the Income Label Translation Record
    	var searchresults = search.create({
			type:'customrecord_invoice_label',
			columns: [
		          search.createColumn({
		        	  name: 'internalid'
		          }),
		          search.createColumn({
		        	  name: 'custrecord_inv_label_language'
		          })
			          ],
            //filters: [
                //['internalid', 'anyof', revElmtId]
            //]
		});
		
		var result = searchresults.run();
    	
		var resultRange = result.getRange({
	        start: 0,
	        end: 1000
	    });
    	
		var resultLength = resultRange.length;
		log.debug('Result Length', resultLength);
    	
		if (resultLength > 0){
			
			log.debug('Search Results Found', 'SUCCESS');
			
			for (var x = 0; x < resultLength; x++){
				
				var recId = resultRange[x].getValue({
		            name: 'internalid'
		        });
				
				var recLang = resultRange[x].getText({
					name: 'custrecord_inv_label_language'
				});
				
				log.debug('Custom Record Int ID for Result ' + x, recId);
				log.debug('Language for Result ' + x, recLang);
				
				
				if (recLang == custLanguageTxt){
					
					log.debug('Got a Hit!', 'Update Customer');
					
					custRec.setValue({
					    fieldId: 'custentity_statement_label_translation',
					    value: recId,
					    ignoreFieldChange: true
					});
					
					break;
					
				}//End if (recLang == custLanguageTxt)
				
			}//End for x loop
		
		}//End if (resultLength > 0)
    	
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
        beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
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
function is_cus_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



