/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jun 2022     Doug Humberd     Gathers a list of all Employee Hierarchy Supervisors that will Approve the PO
 *                            Doug Humberd     List will be used to determine if Finance, CFO, or CEO will be bypassed (not have to approve a second time)
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const PO_APPROVERS_REC = 1;//Custom Record: SCG Purchase Order Approvers



/**
 * Gets a list of Employee Hierarchy Supervisors that will need to approve the PO
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_datb_dupApproversToBypass(form, type){
	
	try{
		
		var poId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Purchase Order ID', poId);
		
		//var inactive = 'F';
		var approverList = [];
		var dupBypassList = [];
		var apprLimitReached = 'N';
		//var pipe = '|';

		
		//Set initial pipe on the Approver List
		//approverList.push(pipe);

		
		var poTotal = nlapiGetFieldValue('total');
		nlapiLogExecution('DEBUG', 'PO Total', poTotal);
		
		var employee = nlapiGetFieldValue('employee');
		nlapiLogExecution('DEBUG', 'Employee', employee);
		
		var supervisor = nlapiLookupField('employee', employee, 'supervisor');
		nlapiLogExecution('DEBUG', 'Initial Supervisor', supervisor);
		
		//var supId = Number(supervisor);
		
		if (!isEmpty(supervisor)){
			
			approverList.push(supervisor);
			//approverList.push(supId);
			//approverList.push(pipe);
			
			while (apprLimitReached == 'N'){
				
				var supervisorFields = nlapiLookupField('employee', supervisor, ['purchaseorderapprovallimit', 'supervisor']);
				
				var purchApprvlLimit = supervisorFields.purchaseorderapprovallimit;
				var nextSupervisor = supervisorFields.supervisor;
				nlapiLogExecution('DEBUG', 'PO Approval Limit: ' + purchApprvlLimit, 'Next Supervisor: ' + nextSupervisor);
				
				//var nextSupId = Number(nextSupervisor);
				
				if (isEmpty(purchApprvlLimit)){
					nlapiLogExecution('DEBUG', 'No PO Approval Limit Found', 'Set Limit = 0');
					purchApprvlLimit = 0;
				}
				
				if (Number(purchApprvlLimit) < poTotal){
					if (!isEmpty(nextSupervisor)){
						approverList.push(nextSupervisor);
						//approverList.push(nextSupId);
						//approverList.push(pipe);
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
		
		nlapiLogExecution('DEBUG', 'Supervisor List', approverList);
		
		//approverList = approverList.toString();
		
		//nlapiLogExecution('DEBUG', 'Supervisor List after toString', approverList);
		
		
		var execApprovers = nlapiLookupField('customrecord_scg_purchase_order_approver', PO_APPROVERS_REC, ['custrecord_scg_poa_finance_approver', 'custrecord_scg_poa_cfo_approver', 'custrecord_scg_poa_ceo_approver']);
		
		var fin_appr = execApprovers.custrecord_scg_poa_finance_approver;
		var cfo_appr = execApprovers.custrecord_scg_poa_cfo_approver;
		var ceo_appr = execApprovers.custrecord_scg_poa_ceo_approver;
		
		nlapiLogExecution('DEBUG', 'Finance Approver', fin_appr);
		nlapiLogExecution('DEBUG', 'CFO Approver', cfo_appr);
		nlapiLogExecution('DEBUG', 'CEO Approver', ceo_appr);
		
		if (approverList.indexOf(fin_appr) != -1){
			dupBypassList.push('A');
		}
		if (approverList.indexOf(cfo_appr) != -1){
			dupBypassList.push('B');
		}
		if (approverList.indexOf(ceo_appr) != -1){
			dupBypassList.push('C');
		}
		
		nlapiLogExecution('DEBUG', 'Duplicate Approver Bypass List', dupBypassList);
		
		dupBypassList = dupBypassList.toString();
		
		nlapiLogExecution('DEBUG', 'Duplicate Approver Bypass List after toString', dupBypassList);
		
		/*
		
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
		
		*/
		
		
		//return approverList;
		return dupBypassList;

		
	}catch(e){
		is_datb_logError(e);
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
function is_datb_logError(e) {
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



