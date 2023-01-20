/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Mar 2021     Doug Humberd     Checks to see if any Department Approvers are missing based on the various line level Departments
 * 1.05       29 Mar 2021     Doug Humberd     Updated to also check for missing ELT Member values
 * 1.10       22 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/



/**
 * Gets a list of Department Approvers based on the various line level Department values
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_cmda_chkMissingDeptApprovers(form, type){
	
	try{
		
		var poId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Purchase Order ID', poId);
		
		var missing = 'F';
		
		//var depts = [];
		
		//Build a list of department values on the PO
		//var itemCount = nlapiGetLineItemCount('item');
		
		//for (var i = 1; itemCount && i <= itemCount; i++){
			
			//var department = nlapiGetLineItemValue('item', 'department', i);
			//nlapiLogExecution('DEBUG', 'Department Line ' + i, department);
			
			//if (depts.indexOf(department) == -1){
				//depts.push(department);
			//}
			
		//}//End for i loop
		
		//var numDepts = depts.length;
		//nlapiLogExecution('DEBUG', 'Number of Departments Found', numDepts);
		//nlapiLogExecution('DEBUG', 'Department List', depts);
		
		var department = nlapiGetFieldValue('custbody_scg_dept_resp_4_apprvl');
		nlapiLogExecution('DEBUG', 'Department', department);
		
		
		//for (var d = 0; d < numDepts; d++){
			
			//var deptId = depts[d];
			//nlapiLogExecution('DEBUG', 'Dept Id ' + d, deptId);
			
			//var deptApprover = nlapiLookupField('department', deptId, 'custrecord_department_approver');
			//nlapiLogExecution('DEBUG', 'Department Approver ' + d, deptApprover);
			
			//var eltMember = nlapiLookupField('department', deptId, 'custrecord_scg_dept_elt_member');
			//nlapiLogExecution('DEBUG', 'Department Approver ' + d, eltMember);
			
			//var number = Number(d) + 1;
			//var deptAppIntId = 'custbody_department_approver_' + number;
			//nlapiLogExecution('DEBUG', 'Department Approver Internal ID', deptAppIntId);

			//if (isEmpty(deptApprover) || isEmpty(eltMember)){
				//nlapiLogExecution('DEBUG', 'Department Approver or ELT Member Missing for Dept:', department);
				//missing = 'T';
			//}
			
		//}//End for d loop
		
		var deptApprovers = nlapiLookupField('department', department, ['custrecord_scg_amer_dir_approver', 'custrecord_scg_amer_vp_approver', 'custrecord_scg_amer_elt_approver', 'custrecord_scg_apac_dir_approver', 'custrecord_scg_apac_vp_approver', 'custrecord_scg_apac_elt_approver', 'custrecord_scg_emea_dir_approver', 'custrecord_scg_emea_vp_approver', 'custrecord_scg_emea_elt_approver']);
		
		var amer_dir = deptApprovers.custrecord_scg_amer_dir_approver;
		var amer_vp = deptApprovers.custrecord_scg_amer_vp_approver;
		var amer_elt = deptApprovers.custrecord_scg_amer_elt_approver;
		var apac_dir = deptApprovers.custrecord_scg_apac_dir_approver;
		var apac_vp = deptApprovers.custrecord_scg_apac_vp_approver;
		var apac_elt = deptApprovers.custrecord_scg_apac_elt_approver;
		var emea_dir = deptApprovers.custrecord_scg_emea_dir_approver;
		var emea_vp = deptApprovers.custrecord_scg_emea_vp_approver;
		var emea_elt = deptApprovers.custrecord_scg_emea_elt_approver;
		
		nlapiLogExecution('DEBUG', 'Americas Director', amer_dir);
		nlapiLogExecution('DEBUG', 'Americas VP/SVP/GM', amer_vp);
		nlapiLogExecution('DEBUG', 'Americas ELT Member', amer_elt);
		nlapiLogExecution('DEBUG', 'APAC Director', apac_dir);
		nlapiLogExecution('DEBUG', 'APAC VP/SVP/GM', apac_vp);
		nlapiLogExecution('DEBUG', 'APAC ELT Member', apac_elt);
		nlapiLogExecution('DEBUG', 'EMEA Director', emea_dir);
		nlapiLogExecution('DEBUG', 'EMEA VP/SVP/GM', emea_vp);
		nlapiLogExecution('DEBUG', 'EMEA ELT Member', emea_elt);
		
		
		if (isEmpty(amer_dir) || isEmpty(amer_vp) || isEmpty(amer_elt) || isEmpty(apac_dir) || isEmpty(apac_vp) || isEmpty(apac_elt) || isEmpty(emea_dir) || isEmpty(emea_vp) || isEmpty(emea_elt)){
			nlapiLogExecution('DEBUG', 'Department Approver(s) Missing for Dept:', department);
			missing = 'T';
		}
		
		
		return missing;

		
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



