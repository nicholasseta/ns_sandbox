/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     27 Jan 2022     Doug Humberd     Sets tax code and tax rate fields from values sent over from SalesForce and stored in custom fields
 *  
 * 
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
	
	//const SF_TAX_AE = '12303';
	//const SF_TAX_AT = '12291';
	//const SF_TAX_AU = '12298';
	//const SF_TAX_CA = '12307';
	//const SF_TAX_CH = '12300';
	//const SF_TAX_DE = '12302';
	//const SF_TAX_DK = '12301';
	//const SF_TAX_FR = '12299';
	//const SF_TAX_GB = '12297';
	//const SF_TAX_IE = '12295';
	//const SF_TAX_MA = '12305';
	//const SF_TAX_NL = '12294';
	//const SF_TAX_NO = '12296';
	//const SF_TAX_NZ = '13008';
	//const SF_TAX_RO = '13009';
	//const SF_TAX_SE = '12292';
	//const SF_TAX_US = '12290';
	//const SF_TAX_ZA = '12304';
   
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
    		is_sertf_setExpRptTaxFields(context);
    	}catch(e){
    		is_sertf_logError(e);
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

    }
    
    
    
    
    
    function is_sertf_setExpRptTaxFields(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	log.debug('setExpRptTaxFields', 'START');
    	
    	var rec = context.newRecord;
    	//log.debug('context.newRecord', rec);
    	
    	var recId = rec.id;
    	//var recId = context.newRecord.id;
    	var recType = rec.type;
    	
    	log.debug('Record Type = ' + recType, 'Record Id = ' + recId);
    	
    	//Only run if Override Tax Fields is checked
    	var overrideTaxFields = rec.getValue({
    	    fieldId: 'custbody_scg_override_tax_fields'
    	});
    	log.debug('Override Tax Fields', overrideTaxFields);
    	
    	if (overrideTaxFields != true){
    		log.debug('Override Tax Fields Not Checked', 'EXIT');
    		return;
    	}
    	
    	var nexusCountry = rec.getValue({
    	    fieldId: 'nexus_country'
    	});
    	log.debug('Nexus Country', nexusCountry);
    	
    	
    	//Do Not Run if Nexus Country = US
    	if (nexusCountry == 'US'){
    		log.debug('Nexus Country = ' + nexusCountry, 'EXIT');
    		return;
    	}
    	
    	
    	//var nexus = rec.getValue({
    		//fieldId: 'nexus'
    	//});
		//log.debug('Nexus', nexus);
		
		//var shipState = rec.getValue({
    		//fieldId: 'shipstate'
    	//});
		//log.debug('Ship State / Province', shipState);
    	
    	
    	var sfTaxCode;
    	var setTaxCode = 'Y';
    	
    	
    	/*
    	
    	//Determine Tax Code based on Nexus Country
		switch (nexusCountry){
		
		case 'AE'://United Arab Emirates
			sfTaxCode = SF_TAX_AE;
		break;
		case 'AT'://Austria
			sfTaxCode = SF_TAX_AT;
		break;
		case 'AU'://Australia
			sfTaxCode = SF_TAX_AU;
		break;
		case 'CA'://Canada
			sfTaxCode = SF_TAX_CA;
		break;
		case 'CH'://Switzerland
			sfTaxCode = SF_TAX_CH;
		break;
		case 'DE'://Germany
			sfTaxCode = SF_TAX_DE;
		break;
		case 'DK'://Denmark
			sfTaxCode = SF_TAX_DK;
		break;
		case 'FR'://France
			sfTaxCode = SF_TAX_FR;
		break;
		case 'GB'://United Kingdom
			sfTaxCode = SF_TAX_GB;
		break;
		case 'IE'://Ireland
			sfTaxCode = SF_TAX_IE;
		break;
		case 'MA'://Morocco
			sfTaxCode = SF_TAX_MA;
		break;
		case 'NL'://Netherlands
			sfTaxCode = SF_TAX_NL;
		break;
		case 'NO'://Norway
			sfTaxCode = SF_TAX_NO;
		break;
		case 'NZ'://New Zealand
			sfTaxCode = SF_TAX_NZ;
		break;
		case 'RO'://Romania
			sfTaxCode = SF_TAX_RO;
		break;
		case 'SE'://Sweden
			sfTaxCode = SF_TAX_SE;
		break;
		case 'US'://United States
			sfTaxCode = SF_TAX_US;
		break;
		case 'ZA'://South Africa
			sfTaxCode = SF_TAX_ZA;
		break;
		
		default://Nexus Country Not in List
			setTaxCode = 'N';
		break;
		}
    	
		*/
		
    	
    	//Identify Tax Code based on Nexus Country
    	var searchresults = search.create({
			type:'salestaxitem',
			columns: [
		          search.createColumn({
		        	  name: 'internalid'
		          })
			          ],
            filters: [
                ['name', 'startswith', 'SF-TAX-'],
                'AND',
                ['name', 'contains', '-' + nexusCountry]
            ]
		});
		
		var result = searchresults.run();
    	
		var resultRange = result.getRange({
	        start: 0,
	        end: 1
	    });
    	
		var resultLength = resultRange.length;
		log.debug('Search Result Length', resultLength);
    	
		if (resultLength == 0){
			log.debug('No SF-Tax Code found for Nexus Country ' + nexusCountry, 'TAX CODE NOT FOUND');
			setTaxCode = 'N';
		}
    	
    	
		sfTaxCode = resultRange[0].getValue({
            name: 'internalid'
  		});
		log.debug('Tax Code ID', sfTaxCode);
    	
    	
    	//*******************************************************************
    	
		var sfTaxAmt;
    	var sfTaxRate;
    	var sfTaxRate2;
    	
    	
    	//var sfTotalTax = rec.getValue({
    	    //fieldId: 'custbody_scg_sf_total_tax'
    	//});
    	//log.debug('SF Total Tax', sfTotalTax);
		
		
		var expCount = rec.getLineCount({
    	    sublistId: 'expense'
    	});
    	
    	for (var i = 0; i < expCount; i++){

    		//Get SF Values from Exp Rpt Line
    		sfTaxAmt = rec.getSublistValue({
			    sublistId: 'expense',
			    fieldId: 'custcol_scg_sf_tax_amt',
			    line: i
			});
			log.debug('SF Tax Amount - Line ' + i, sfTaxAmt);
    		
    		sfTaxRate = rec.getSublistValue({
			    sublistId: 'expense',
			    fieldId: 'custcol_scg_sf_tax_rate',
			    line: i
			});
			log.debug('SF Tax Rate - Line ' + i, sfTaxRate);
			
			sfTaxRate2 = rec.getSublistValue({
			    sublistId: 'expense',
			    fieldId: 'custcol_scg_sf_tax_rate2',
			    line: i
			});
			log.debug('SF Tax Rate 2 - Line ' + i, sfTaxRate2);
			
			
			if (nexusCountry == 'CA'){

				if (setTaxCode == 'Y'){
					
					log.debug('Set Tax Code Line ' + i, sfTaxCode);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'taxcode',
					    line: i,
					    value: sfTaxCode
					});
					
				}
				
				
				if (!isEmpty(sfTaxRate)){
					
					log.debug('Set Tax Rate Line ' + i, sfTaxRate);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'taxrate1',
					    line: i,
					    value: sfTaxRate
					});
					
				}
				
				
				if (!isEmpty(sfTaxRate2)){
					
					log.debug('Set PST Line ' + i, sfTaxRate2);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'taxrate2',
					    line: i,
					    value: sfTaxRate2
					});
					
				}
				
				
				if (!isEmpty(sfTaxAmt)){
					
					log.debug('Set Tax Amount Line ' + i, sfTaxAmt);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'tax1amt',
					    line: i,
					    value: sfTaxAmt
					});
					
				}
				
				
			}else{
				
				if (setTaxCode == 'Y'){
					
					log.debug('Set Tax Code Line ' + i, sfTaxCode);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'taxcode',
					    line: i,
					    value: sfTaxCode
					});
					
				}
				
				
				if (!isEmpty(sfTaxRate)){
					
					log.debug('Set Tax Rate Line ' + i, sfTaxRate);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'taxrate1',
					    line: i,
					    value: sfTaxRate
					});
					
				}
				
				
				if (!isEmpty(sfTaxAmt)){
					
					log.debug('Set Tax Amount Line ' + i, sfTaxAmt);
					
					rec.setSublistValue({
					    sublistId: 'expense',
					    fieldId: 'tax1amt',
					    line: i,
					    value: sfTaxAmt
					});
					
				}
				
				
			}//End if (nexusCountry != 'CA')
			
    		
    	}//End for i loop
    	
    	
    }
    
    
    
    
    
    
    function is_sertf_fullyApplyCMtoInv(context){
    	
    	//Run on Create
    	if (context.type != 'create' && context.type != 'edit'){//CHANGE OK PER MATT - FIXES TIMING ISSUE WITH MANUAL APPLYING CMs to INVs
    	//if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('fullyApplyCMtoInv', 'START');
    	
    	var rec = context.newRecord;
    	//log.debug('context.newRecord', rec);
    	
    	var recId = rec.id;
    	//var recId = context.newRecord.id;
    	var recType = rec.type;
    	
    	log.debug('Record Type = ' + recType, 'Record Id = ' + recId);
    	
    	var origSys = rec.getValue({
    	    fieldId: 'custbody_originating_system'
    	});
    	log.debug('Originating System', origSys);
    	
    	
    	//Only Run on Credit Memos Originating from SF
    	if (recType != 'creditmemo'){
    		return;
    	}
    	
    	if (origSys != '3'){//3 = Salesforce
    		return;
    	}
    	
    	
    	var cmRec = record.load({
    	    type: 'creditmemo',
    	       id: recId,
    	       isDynamic: false
    	});
    	
    	
    	//Get CM Total
    	var cmTotal = cmRec.getValue({
    	    fieldId: 'total'
    	});
    	log.debug('CM Total', cmTotal);
    	
    	
    	//Apply to Invoice
    	var applyCount = cmRec.getLineCount({
    	    sublistId: 'apply'
    	});
    	log.debug('applyCount', applyCount);

    	
    	for (var x = 0; x < applyCount; x++){	
        	
        	var apply = cmRec.getSublistValue({
        	    sublistId: 'apply',
        	    fieldId: 'apply',
        	    line: x
        	});
        	
        	if (apply == true){
        		
        		log.debug('Apply Line ' + x, apply);
        		
        		var amtDue = cmRec.getSublistValue({
            	    sublistId: 'apply',
            	    fieldId: 'due',
            	    line: x
            	});
        		log.debug('Amt Due Line ' + x, amtDue);
        		
        		var amtApplied = cmRec.getSublistValue({
            	    sublistId: 'apply',
            	    fieldId: 'amount',
            	    line: x
            	});
        		log.debug('Current Amount Applied Line ' + x, amtApplied);
        		
        		
        		if (amtApplied == cmTotal){
        			log.debug('CM is already fully applied', 'EXIT');
        			break;
        		}
        		
        		
        		//If the CM Total Amount is > Amount Due, Recalculate Amount for Apply Line
        		if (Number(cmTotal) > Number(amtDue)){
        			
        			log.debug('CM Total Amt > Amount Due', 'GREATER THAN');
        			
        			var newCMAmt = Number(amtDue);
        			log.debug('Payment Net Amount > Amount Due', 'Recalculated Net Amount: ' + newCMAmt);
            		
            		cmRec.setSublistValue({
            		    sublistId: 'apply',
            		    fieldId: 'amount',
            		    line: x,
            		    value: newCMAmt
            		});
        			
        		}else{//cmTotal <= amtDue
        			
        			log.debug('CM Total Amt <= Amount Due', 'LESS THAN or EQUAL');
            		
            		cmRec.setSublistValue({
            		    sublistId: 'apply',
            		    fieldId: 'amount',
            		    line: x,
            		    value: cmTotal
            		});
        			
        		}//End if cmTotal <= amtDue
        		
        		
        		//Save the CM
        		log.debug('Save the CM', 'SAVE');
        		var recordId = cmRec.save({
        		    enableSourcing: true,
        		    ignoreMandatoryFields: true
        		});
        		
        		
        		break;

        		
        	}//End if (apply == true)
        	
        }//End for x loop
    	
    	log.debug('fullyApplyCMtoInv', 'END');
    	
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
function is_sertf_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



