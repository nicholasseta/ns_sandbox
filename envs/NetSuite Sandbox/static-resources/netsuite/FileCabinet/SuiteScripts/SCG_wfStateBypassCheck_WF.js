/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2022     Doug Humberd     Determines if any WF States should be bypassed because the Next Approver is the same employee
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const PURCH_ORD_APPROVER_REC = '1';//SCG Purchase Order Approvers Custom Record



/**
 * Determines if any WF States should be bypassed because the Next Approver is the same employee
 * 
 * @returns Integer (0, 1, or 2) - Identifies how many states to bypass
 */
function is_wsbc_numStatesToBypass(form, type){
	
	try{
		
		var poId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Purch Ord ID', poId);
		
		//Get the Region from the Subsidiary Record
		var subsidiary = nlapiGetFieldValue('subsidiary');
		nlapiLogExecution('DEBUG', 'Subsidiary', subsidiary);
		var region = nlapiLookupField('subsidiary', subsidiary, 'custrecord_sub_region');
		nlapiLogExecution('DEBUG', 'Region', region);
		
		//Get the Department
		var dept = nlapiGetFieldValue('custbody_scg_dept_resp_4_apprvl');
		nlapiLogExecution('DEBUG', 'Responsible Department', dept);
		
		//Get Current State of the WF
		var cState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		nlapiLogExecution('DEBUG', 'Current State', cState);
		
		var nextApprover = nlapiGetFieldValue('nextapprover');
		nlapiLogExecution('DEBUG', 'Current Next Approver', nextApprover);
		
		var statesToBypass = 0;
		
		
		//Get the VP and ELT Approver values based on the Current State of the Workflow
		var vpApprover;
		var eltApprover;
		
		switch (cState){
		case '2'://Director Approval
			if (region == '1'){//Americas
				vpApprover = nlapiLookupField('department', dept , 'custrecord_scg_amer_vp_approver');
				eltApprover = nlapiLookupField('department', dept , 'custrecord_scg_amer_elt_approver');
			}
			if (region == '2'){//APAC
				vpApprover = nlapiLookupField('department', dept , 'custrecord_scg_apac_vp_approver');
				eltApprover = nlapiLookupField('department', dept , 'custrecord_scg_apac_elt_approver');
			}
			if (region == '3'){//EMEA
				vpApprover = nlapiLookupField('department', dept , 'custrecord_scg_emea_vp_approver');
				eltApprover = nlapiLookupField('department', dept , 'custrecord_scg_emea_elt_approver');
			}
			
			nlapiLogExecution('DEBUG', 'VP Approver: ' + vpApprover, 'ELT Approver: ' + eltApprover);
			
			//Determine how many WF States to Bypass, if any
			if (nextApprover == vpApprover && nextApprover != eltApprover){
				statesToBypass = 1;
			}

			if (nextApprover == vpApprover && nextApprover == eltApprover){
				statesToBypass = 2;
			}
			
			break;
		case '3':// VP/SVP/GM Approval
			if (region == '1'){//Americas
				eltApprover = nlapiLookupField('department', dept , 'custrecord_scg_amer_elt_approver');
			}
			if (region == '2'){//APAC
				eltApprover = nlapiLookupField('department', dept , 'custrecord_scg_apac_elt_approver');
			}
			if (region == '3'){//EMEA
				eltApprover = nlapiLookupField('department', dept , 'custrecord_scg_emea_elt_approver');
			}
			
			nlapiLogExecution('DEBUG', 'VP Approver: ' + vpApprover, 'ELT Approver: ' + eltApprover);
			
			//Determine how many WF States to Bypass, if any
			if (nextApprover == eltApprover){
				statesToBypass = 1;
			}
			
			break;
		default:
			statesToBypass = 0;
			break;
		}
		
		
		return statesToBypass;
		
	}catch(e){
		is_wsbc_logError(e);
		return 0;
	}
	
}


/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_wsbc_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
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



