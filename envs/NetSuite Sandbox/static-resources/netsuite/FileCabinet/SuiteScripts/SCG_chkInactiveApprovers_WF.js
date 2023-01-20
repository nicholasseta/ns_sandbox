/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Feb 2022     Doug Humberd     Checks to see if any Approvers up the line are inactive
 * 1.05       11 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const PO_APPROVERS_REC = 1;//Custom Record: SCG Purchase Order Approvers



/**
 * Gets a list of Department Approvers based on the various line level Department values
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_cia_chkForInactiveApprovers(form, type){
	
	try{
		
		var poId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Purchase Order ID', poId);
		
		var inactive = 'F';
		var approverList = [];
		var apprLimitReached = 'N';

		
		//var department = nlapiGetFieldValue('custbody_scg_dept_resp_4_apprvl');
		//nlapiLogExecution('DEBUG', 'Department', department);
		
		var poTotal = nlapiGetFieldValue('total');
		nlapiLogExecution('DEBUG', 'PO Total', poTotal);
		
		var employee = nlapiGetFieldValue('employee');
		nlapiLogExecution('DEBUG', 'Employee', employee);
		
		var supervisor = nlapiLookupField('employee', employee, 'supervisor');
		nlapiLogExecution('DEBUG', 'Initial Supervisor', supervisor);
		
		if (!isEmpty(supervisor)){
			
			approverList.push(supervisor);
			
			while (apprLimitReached == 'N'){
				
				var supervisorFields = nlapiLookupField('employee', supervisor, ['purchaseorderapprovallimit', 'supervisor']);
				
				var purchApprvlLimit = supervisorFields.purchaseorderapprovallimit;
				var nextSupervisor = supervisorFields.supervisor;
				nlapiLogExecution('DEBUG', 'PO Approval Limit: ' + purchApprvlLimit, 'Next Supervisor: ' + nextSupervisor);
				
				if (isEmpty(purchApprvlLimit)){
					nlapiLogExecution('DEBUG', 'No PO Approval Limit Found', 'Set Limit = 0');
					purchApprvlLimit = 0;
				}
				
				if (Number(purchApprvlLimit) < poTotal){
					if (!isEmpty(nextSupervisor)){
						approverList.push(nextSupervisor);
						supervisor = nextSupervisor
					}else{
						nlapiLogExecution('DEBUG', 'Next Supervisor Empty', 'End Supervisor Check Loop');
						break;
					}
				}else{
					nlapiLogExecution('DEBUG', 'Approval Limit Reached', 'Stop Adding Supervisors');
					apprLimitReached = 'Y';
				}
				
			}//End while loop
			
		}
		
		
		//var deptApprovers = nlapiLookupField('department', department, ['custrecord_scg_amer_dir_approver', 'custrecord_scg_amer_vp_approver', 'custrecord_scg_amer_elt_approver', 'custrecord_scg_apac_dir_approver', 'custrecord_scg_apac_vp_approver', 'custrecord_scg_apac_elt_approver', 'custrecord_scg_emea_dir_approver', 'custrecord_scg_emea_vp_approver', 'custrecord_scg_emea_elt_approver']);
		
		//var amer_dir = deptApprovers.custrecord_scg_amer_dir_approver;
		//var amer_vp = deptApprovers.custrecord_scg_amer_vp_approver;
		//var amer_elt = deptApprovers.custrecord_scg_amer_elt_approver;
		//var apac_dir = deptApprovers.custrecord_scg_apac_dir_approver;
		//var apac_vp = deptApprovers.custrecord_scg_apac_vp_approver;
		//var apac_elt = deptApprovers.custrecord_scg_apac_elt_approver;
		//var emea_dir = deptApprovers.custrecord_scg_emea_dir_approver;
		//var emea_vp = deptApprovers.custrecord_scg_emea_vp_approver;
		//var emea_elt = deptApprovers.custrecord_scg_emea_elt_approver;
		
		//nlapiLogExecution('DEBUG', 'Americas Director', amer_dir);
		//nlapiLogExecution('DEBUG', 'Americas VP/SVP/GM', amer_vp);
		//nlapiLogExecution('DEBUG', 'Americas ELT Member', amer_elt);
		//nlapiLogExecution('DEBUG', 'APAC Director', apac_dir);
		//nlapiLogExecution('DEBUG', 'APAC VP/SVP/GM', apac_vp);
		//nlapiLogExecution('DEBUG', 'APAC ELT Member', apac_elt);
		//nlapiLogExecution('DEBUG', 'EMEA Director', emea_dir);
		//nlapiLogExecution('DEBUG', 'EMEA VP/SVP/GM', emea_vp);
		//nlapiLogExecution('DEBUG', 'EMEA ELT Member', emea_elt);
		
		var execApprovers = nlapiLookupField('customrecord_scg_purchase_order_approver', PO_APPROVERS_REC, ['custrecord_scg_poa_finance_approver', 'custrecord_scg_poa_cfo_approver', 'custrecord_scg_poa_ceo_approver']);
		
		var fin_appr = execApprovers.custrecord_scg_poa_finance_approver;
		var cfo_appr = execApprovers.custrecord_scg_poa_cfo_approver;
		var ceo_appr = execApprovers.custrecord_scg_poa_ceo_approver;
		
		nlapiLogExecution('DEBUG', 'Finance Approver', fin_appr);
		nlapiLogExecution('DEBUG', 'CFO Approver', cfo_appr);
		nlapiLogExecution('DEBUG', 'CEO Approver', ceo_appr);
		
		//if (!isEmpty(amer_dir)){
			//approverList.push(amer_dir);
		//}
		//if (!isEmpty(amer_vp)){
			//approverList.push(amer_vp);
		//}
		//if (!isEmpty(amer_elt)){
			//approverList.push(amer_elt);
		//}
		//if (!isEmpty(apac_dir)){
			//approverList.push(apac_dir);
		//}
		//if (!isEmpty(apac_vp)){
			//approverList.push(apac_vp);
		//}
		//if (!isEmpty(apac_elt)){
			//approverList.push(apac_elt);
		//}
		//if (!isEmpty(emea_dir)){
			//approverList.push(emea_dir);
		//}
		//if (!isEmpty(emea_vp)){
			//approverList.push(emea_vp);
		//}
		//if (!isEmpty(emea_elt)){
			//approverList.push(emea_elt);
		//}
		if (!isEmpty(fin_appr)){
			approverList.push(fin_appr);
		}
		if (!isEmpty(cfo_appr)){
			approverList.push(cfo_appr);
		}
		if (!isEmpty(ceo_appr)){
			approverList.push(ceo_appr);
		}
		
		nlapiLogExecution('DEBUG', 'Approvers List to Review', approverList);
		
		
		//Check Approver List for Inactive Employees
		for (var x = 0; x < approverList.length; x++){
			
			var empId = approverList[x];
			var empInactive = nlapiLookupField('employee', empId, 'isinactive');
			nlapiLogExecution('DEBUG', 'Employee: ' + empId, 'Inactive: ' + empInactive);
			
			if (empInactive == 'T'){
				nlapiLogExecution('DEBUG', 'Inactive Approver Found', 'Do Not Allow PO Creation');
				inactive = 'T';
				break;
			}
			
		}
		
		
		return inactive;

		
	}catch(e){
		is_cmda_logError(e);
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
function is_cmda_logError(e) {
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



