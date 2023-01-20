/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Aug 2020     Doug Humberd     Suitelet to handle Approvals / Rejections for Purchase Orders from External Links
 *                            Doug Humberd     Added functionality to capture Reject Reason
 * 1.05       04 Mar 2021     Doug Humberd     Added logic to update Button Approver field on PO
 * 1.10       25 Mar 2021     Doug Humberd     Updated for new WF - Certent Purchase Order Approval
 * 1.15       23 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 1.20       10 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 *
 */

function purchOrd_Approval_Link(request,response){
	if (request.getMethod() == 'GET'){
		
		var processWF = 'Y';
	
        var poId = request.getParameter('poid');
        var action = request.getParameter('action');
        var poRecType = request.getParameter('porectype');
        var cState = request.getParameter('cstate');
        var nextApp = request.getParameter('approver');

        nlapiLogExecution('DEBUG', 'ID = ' + poId, 'Action = ' + action);
        nlapiLogExecution('DEBUG', 'poRecType = ' + poRecType, 'Current State = ' + cState);
        nlapiLogExecution('DEBUG', 'Next Approver from Email Link', nextApp);
        
        //Only Run if the Next Approver from the Email Link is the Next Approver on the Purchase Order
        var nextApprover = nlapiLookupField('purchaseorder', poId, 'nextapprover');
        nlapiLogExecution('DEBUG', 'Next Approver from PO Record', nextApprover);
        
        if (nextApprover != nextApp){
        	nlapiLogExecution('DEBUG', 'INCORRECT NEXT APPROVER CLICKED APPROVE/REJECT', 'DO NOT TRIGGER WORKFLOW');
        	processWF = 'N';
        	
        	//formTitle = 'Unable to Process';
			//var form = nlapiCreateForm(formTitle, true);
			//var fld = form.addField('custpage_message', 'inlinehtml', 'Unable to Process');
			//fld.setDefaultValue('<font size="8"><b>Unable to ' + action + ' Purchase Order<br>Incorrect Next Approver</b></font>');
        	
        	//return;
        }
        
        
        var wfState = '';

        var poNum = nlapiLookupField('purchaseorder', poId, 'transactionnumber');
        var formTitle = "";
        nlapiLogExecution('DEBUG', 'Trans Number', poNum);
        
        
        if (processWF == 'Y'){
        	
        	
        	// Trigger the Rejection state of the workflow
            // Determine the appropriate button ID
    		if (action == 'reject'){
    			var wfButtonId = '';
    			//var wfButtonId = 'workflowaction_reject';
    			switch (cState) {
    			case '2'://Supervisor Approval
    				wfButtonId = 'workflowaction_director_reject';
    				wfState = 'workflowstate_director_approval';
    				break;
    			//case '3':// VP/SVP/GM Approval
    				//wfButtonId = 'workflowaction_vp_svp_gm_reject';
    				//wfState = 'workflowstate_vp_svp_gm_approval';
    				//break;
    			//case '4'://ELT Member Approval
    				//wfButtonId = 'workflowaction_elt_member_reject';
    				//wfState = 'workflowstate_elt_member_approval';
    				//break;
    			case '5'://Head of FP&A Approval
    				wfButtonId = 'workflowaction_final_finance_reject';
    				wfState = 'workflowstate_finance_approver';
    				break;
    			case '6'://CFO Approver
    				wfButtonId = 'workflowaction_cfo_reject';
    				wfState = 'workflowstate_cfo_approval';
    				break;
    			case '7'://CEO Approval
    				wfButtonId = 'workflowaction_ceo_reject';
    				wfState = 'workflowstate_ceo_approval';
    				break;
    			case '9'://Finance - Procurement 2
    				wfButtonId = 'workflowaction_finance_2_reject';
    				wfState = 'workflowstate_finance_procurement_2';
    				break;
    			default:
    				break;
    			}
    			nlapiLogExecution('debug', 'wfButtonId: ' + wfButtonId, 'wfState: ' + wfState);
    			
    			//var wfInstance = nlapiTriggerWorkflow(poRecType, poId, 'customworkflow_scg_po_approvals', wfButtonId);
    		}
    		
    		
    		// Trigger the Approval state of the workflow
    		// Determine the appropriate button ID
    		if (action == 'approve'){
    			var wfButtonId = '';
    			//var wfButtonId = 'workflowaction_approve';
    			switch (cState) {
    			case '2'://Supervisor Approval
    				wfButtonId = 'workflowaction_director_approve';
    				wfState = 'workflowstate_director_approval';
    				break;
    			//case '3':// VP/SVP/GM Approval
    				//wfButtonId = 'workflowaction_vp_svp_gm_approve';
    				//wfState = 'workflowstate_vp_svp_gm_approval';
    				//break;
    			//case '4'://ELT Member Approval
    				//wfButtonId = 'workflowaction_elt_member_approve';
    				//wfState = 'workflowstate_elt_member_approval';
    				//break;
    			case '5'://Head of FP&A Approval
    				wfButtonId = 'workflowaction_final_finance_approve';
    				wfState = 'workflowstate_finance_approver';
    				break;
    			case '6'://CFO Approval
    				wfButtonId = 'workflowaction_cfo_approve';
    				wfState = 'workflowstate_cfo_approval';
    				break;
    			case '7'://CEO Approval
    				wfButtonId = 'workflowaction_ceo_approve';
    				wfState = 'workflowstate_ceo_approval';
    				break;
    			case '9'://Finance - Procurement 2
    				wfButtonId = 'workflowaction_finance_2_approve';
    				wfState = 'workflowstate_finance_procurement_2';
    				break;
    			default:
    				break;
    			}
    			nlapiLogExecution('debug', 'wfButtonId: ' + wfButtonId, 'wfState: ' + wfState);
    			
    			//var wfInstance = nlapiTriggerWorkflow(poRecType, poId, 'customworkflow_scg_po_approvals', wfButtonId);
    		}
        	
        	
        }//End if (processWF == 'Y')
        
		
		
		
		/*

		//Check to see if any vendors are missing from the lines.  If yes, display 'unable to approve' message
		if (chkVendors == 'Y'){
			
			var missVend = 'F';
			
			var prRec = nlapiLoadRecord(prRecType, poId);
			
			var itemCount = prRec.getLineItemCount('item');
			
			if (itemCount > 0){
				nlapiLogExecution('DEBUG', 'Loop Through Item Lines', 'ITEM CHECK');
			}
			
			for (var i = 1; itemCount && i <= itemCount; i++){
				
				var vendor = prRec.getLineItemValue('item', 'povendor', i);
				nlapiLogExecution('DEBUG', 'Vendor', vendor);
				
				if (isEmpty(vendor)){
					missVend = 'T';
					break;
				}
				
			}//End for i loop
				
			
			var expCount = prRec.getLineItemCount('expense');
			
			if (expCount > 0){
				nlapiLogExecution('DEBUG', 'Loop Through Expense Lines', 'EXPENSE CHECK');
			}
			
			for (var x = 1; expCount && x <= expCount; x++){
				
				var vendor = prRec.getLineItemValue('expense', 'povendor', x);
				nlapiLogExecution('DEBUG', 'Vendor', vendor);
				
				if (isEmpty(vendor)){
					missVend = 'T';
					break;
				}
				
			}//End for x loop
			

			nlapiLogExecution('DEBUG', 'Missing Vendors', missVend);

			
			if (missVend == 'T'){
				var apprTitle = 'Unable to Approve - Vendors Missing';
				var apprMsg = 'Unable to Approve Purchase Requisition - Vendors Missing';
			}else{
				var apprTitle = 'Purchase Requisition Approved';
				var apprMsg = 'Purchase Requisition Approved Successfully';
			}
			
		}else{//if (chkVendors == 'N')
			var apprTitle = 'Purchase Requisition Approved';
			var apprMsg = 'Purchase Requisition Approved Successfully';
		}//End if (chkVendors == 'N')
		
		*/
		
		
		//var apprTitle = 'Purchase Requisition Approved';
		//var apprMsg = 'Purchase Requisition Approved Successfully';
        
		

        if (processWF == 'Y'){
        	
        	
        	//Trigger the Workflow
            if (action == 'approve'){

                nlapiTriggerWorkflow(poRecType, poId, 'customworkflow_is_po_apprvl_wf_2', wfButtonId, wfState);
                
                //Update the 'Button Approver' value on the Purchase Order with the Next Approver Value (tracks who clicked the button)
        		nlapiSubmitField(poRecType, poId, 'custbody_scg_po_button_appvr', nextApp);

              	formTitle = 'Purchase Order Approved';
    			var form = nlapiCreateForm(formTitle, true);
    			var fld = form.addField('custpage_message', 'inlinehtml', 'Purchase Order Approved Successfully');
    			fld.setDefaultValue('<font size="8"><b>Purchase Order Approved Successfully</b></font>');
    			
    			//formTitle = apprTitle;
    			//var form = nlapiCreateForm(formTitle, true);
    			//var fld = form.addField('custpage_message', 'inlinehtml', apprMsg);
    			//fld.setDefaultValue('<font size="8"><b>' + apprMsg + '</b></font>');
    			
            }
            else if (action == 'reject'){
    		
    			var rejReasonFormTitle = 'Reject Reason Required';
    			nlapiLogExecution('DEBUG', 'Title', rejReasonFormTitle);
    			var form = nlapiCreateForm(rejReasonFormTitle, true);

    			var rejField = form.addField('custpage_scg_rejreason', 'textarea', 'Please Enter Reject Reason');
    			rejField.setDefaultValue('');

    			var poidField = form.addField('custpage_poid', 'text', 'Purchase Order ID');
    			poidField.setDefaultValue(poId);
              	poidField.setDisplayType('hidden');
              	
              	var rejButton = form.addField('custpage_rej_button', 'text', 'Reject Button');
              	rejButton.setDefaultValue(wfButtonId);
              	rejButton.setDisplayType('hidden');
              	
              	var rejState = form.addField('custpage_rej_state', 'text', 'Reject State');
              	rejState.setDefaultValue(wfState);
              	rejState.setDisplayType('hidden');
              	
              	var nxtapprvr = form.addField('custpage_next_approver', 'text', 'Next Approver');
              	nxtapprvr.setDefaultValue(nextApp);
              	nxtapprvr.setDisplayType('hidden');
    			
    			var submit = form.addSubmitButton('Submit');
            }
        	
        	
        }else{//processWF == 'N')
        	
        	formTitle = 'Unable to Process';
			var form = nlapiCreateForm(formTitle, true);
			var fld = form.addField('custpage_message', 'inlinehtml', 'Unable to Process');
			fld.setDefaultValue('<font size="8"><b>Unable to ' + action + ' the Purchase Order.<br>You are not the current Next Approver.</b></font>');
        	
        }//End if (processWF == 'N')
        
		
        
	} else {
          var poId = request.getParameter('custpage_poid');
          var reason = request.getParameter('custpage_scg_rejreason');
          nlapiLogExecution('DEBUG', 'Reject Reason', reason);
          var wfButtonId = request.getParameter('custpage_rej_button');
          var wfState = request.getParameter('custpage_rej_state');
          nlapiLogExecution('debug', 'wfButtonId: ' + wfButtonId, 'wfState: ' + wfState);
          var nextApp = request.getParameter('custpage_next_approver');
      
      	if (reason) {
      		
      		nlapiSubmitField('purchaseorder', poId, 'custbody_scg_reject_reason_po', reason);
            nlapiTriggerWorkflow('purchaseorder', poId, 'customworkflow_is_po_apprvl_wf_2', wfButtonId, wfState);
            
            //Update the 'Button Approver' value on the Purchase Order with the Next Approver Value (tracks who clicked the button)
    		nlapiSubmitField('purchaseorder', poId, 'custbody_scg_po_button_appvr', nextApp);
            
            formTitle = 'Purchase Order Rejected';
			var form = nlapiCreateForm(formTitle, true);
			var fld = form.addField('custpage_message', 'inlinehtml', 'Purchase Order Rejected Successfully');
			fld.setDefaultValue('<font size="8"><b>Purchase Order Rejected Successfully</b></font>');
			
        } else {
        	
        	formTitle = 'Invalid Rejection Reason';
			var form = nlapiCreateForm(formTitle, true);
          	var fld = form.addField('custpage_message', 'inlinehtml', 'Invalid rejection reason. Please try again.');
          	fld.setDefaultValue('<font size="8"><b>Invalid rejection reason.  Please try again.<br>This Purchase Order was NOT Rejected.</b></font>');
        }
    }
	
	response.writePage(form);
	
}






function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  



