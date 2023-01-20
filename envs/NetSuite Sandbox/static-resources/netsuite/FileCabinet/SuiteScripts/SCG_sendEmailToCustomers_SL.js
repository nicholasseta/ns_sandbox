/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				01 Jul 2020		Doug Humberd		Executes a Scheduled Script to Send Emails to Customers from Specific Subsidiaries with varying wording / attachments
 * 1.05             08 Jul 2020     Doug Humberd        Updated to archive previous files to attach, rather than delete
 * 1.10             17 Sep 2020     Doug Humberd        Updated to include a 'Reprocess Only Previously Failed Customers' checkbox
 * 1.15             16 Oct 2020     Doug Humberd        Updated to include 'Date of Last Sale' fields
 * 1.20             22 Jun 2021     Doug Humberd        Updated to include LER Email Blast, and to make Subsidiary / Last Sale Dates no longer mandatory
 * 1.25             20 Jan 2022     Doug Humberd        Updated to include 'Include Disabled Invoice Email Customers' field
 *
 */


/**
 * Constants
 */
const EMAIL_ATTACH_FOLDER = '878617';//Customer Bulk Email Attachments Folder
const EMAIL_ATTACH_FOLDER_ARCHIVE = '878618';//Customer Bulk Email Attachments - Archive Folder


/**
 * Global Variables
 */
//var is_setc_context = nlapiGetContext();


/**
 * Logs an exception to the script execution log
 *
 * @appliedtorecord customer invoice
 *
 * @param {String} e Exception
 * @returns {Void}
 */
function is_setc_logError(e) {
    // Log the error based on available details
    var errorMessage = (e instanceof nlobjError) ? {'code': e.getCode(), 'details': e.getDetails(), 'stackTrace': e.getStackTrace()}: {'code': '', 'details': e.toString(), 'stackTrace': ''};
    nlapiLogExecution('ERROR', 'System Error', JSON.stringify(errorMessage));
}


/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function is_setc_sendEmailToCustomers(request, response){
	nlapiLogExecution('DEBUG', 'Send Email to Customers SL', 'START');
    if (request.getMethod()=='GET') {
        try	{
        	
        	var form = nlapiCreateForm('Send Customer Email Blast');
        	
        	//var subsidiary = request.getParameter('subsidiary');
        	//var template = request.getParameter('template');
        	var subsidiary;
        	var template;
        	var file1;
        	var file2;
        	var file3;
        	var file4;
        	var file5;
        	var reprocess = 'F';
        	var lastSaleFrom;
        	var lastSaleTo;
        	var lerEmailBlast = 'F';
        	var inclDisabledEmailCusts = 'F';

        	
            fld = form.addField('custpage_subsidiary', 'multiselect' , 'Subsidiary', 'subsidiary');
            //fld.setDefaultValue(subsidiary);
            //fld.setMandatory(true);
            //subject.setMandatory( true );
            
            fld = form.addField('custpage_ler', 'checkbox', 'LER Email Blast');
            fld.setDefaultValue(lerEmailBlast);
            
            fld = form.addField('custpage_incl_disabled_inv_email_custs', 'checkbox', 'Include Disabled Invoice Email Customers');
            fld.setDefaultValue(inclDisabledEmailCusts);
            
            fld = form.addField('custpage_template', 'select', 'Email Template', 'emailtemplate');
            fld.setDefaultValue(template);
            fld.setMandatory(true);
            
            fld = form.addField('custpage_lastsalefrom', 'date', 'Last Sale Date From');
            //fld.setDefaultValue(lastSaleFrom);
            //fld.setMandatory(true);
            
            fld = form.addField('custpage_lastsaleto', 'date', 'Last Sale Date To');
            //fld.setDefaultValue(lastSaleTo);
            //fld.setMandatory(true);
            
            fld = form.addField('custpage_file1', 'file', 'Attach File 1');
            fld.setDefaultValue(file1);
            fld.setBreakType('startcol');
            
            fld = form.addField('custpage_file2', 'file', 'Attach File 2');
            fld.setDefaultValue(file2);
            
            fld = form.addField('custpage_file3', 'file', 'Attach File 3');
            fld.setDefaultValue(file3);
            
            fld = form.addField('custpage_file4', 'file', 'Attach File 4');
            fld.setDefaultValue(file4);
            
            fld = form.addField('custpage_file5', 'file', 'Attach File 5');
            fld.setDefaultValue(file5);
            
            fld = form.addField('custpage_reprocess', 'checkbox', 'Process Only Previously Failed Customers');
            fld.setDefaultValue(reprocess);
            
            //var urlParamId = 'custpage_url_params';
            //fld = form.addField(urlParamId, 'text', 'URL Parameters');
            //fld.setDisplayType('hidden');
        	
        	form.addSubmitButton('Submit');

            response.writePage(form);
        	
        } catch (e) {
            is_setc_logError(e);
            throw e;
        }
    } else {
        try {
        	
        	subsidiary = request.getParameter('custpage_subsidiary');
        	nlapiLogExecution('DEBUG', 'subsidiary', subsidiary);
        	var splitSubsids = subsidiary.split("");
        	nlapiLogExecution('DEBUG', 'splitSubsids', splitSubsids);
        	nlapiLogExecution('DEBUG', 'Sub Id Count', splitSubsids.length);
        	
        	template = request.getParameter('custpage_template');
        	nlapiLogExecution('DEBUG', 'template', template);
        	
        	lastSaleFrom = request.getParameter('custpage_lastsalefrom');
        	lastSaleTo = request.getParameter('custpage_lastsaleto');
        	nlapiLogExecution('DEBUG', 'Last Sale Date From: ' + lastSaleFrom, 'Lasat Sale Date To: ' + lastSaleTo);
        	
        	reprocess = request.getParameter('custpage_reprocess');
        	nlapiLogExecution('DEBUG', 'reprocess', reprocess);
        	
        	lerEmailBlast = request.getParameter('custpage_ler');
        	nlapiLogExecution('DEBUG', 'LER Email Blast', lerEmailBlast);
        	
        	inclDisabledEmailCusts = request.getParameter('custpage_incl_disabled_inv_email_custs');
        	nlapiLogExecution('DEBUG', 'Incl Disabled Email Custs', inclDisabledEmailCusts);

        	
        	//Move all files in the "Customer Bulk Email Attachments" folder to a date/time archive folder prior to adding new files, if any
        	//EMAIL_ATTACH_FOLDER_ARCHIVE
        	var existFilesSearch = getExistingFiles(EMAIL_ATTACH_FOLDER);
        	
        	if (existFilesSearch){
        		
        		//Calculate the Name of the Archive Folder to be Created - Format: YYYYMMDD_HHMM
        		var date = new Date();
        		var year = date.getFullYear();
        		var month = date.getMonth() + 1;
        		var day = date.getDate();
        		var hour = date.getHours();
        		var minute = date.getMinutes();
        		
        		//nlapiLogExecution('DEBUG', 'Year', year);
        		//nlapiLogExecution('DEBUG', 'Month', month);
        		//nlapiLogExecution('DEBUG', 'Day', day);
        		//nlapiLogExecution('DEBUG', 'Hour', hour);
        		//nlapiLogExecution('DEBUG', 'Minute', minute);
        		
        		if (month < 10){
        			month = '0' + month;
        		}
        		if (day < 10){
        			day = '0' + day;
        		}
        		if (hour < 10){
        			hour = '0' + hour;
        		}
        		if (minute < 10){
        			minute = '0' + minute;
        		}
        		
        		//nlapiLogExecution('DEBUG', 'After Update Month', month);
        		//nlapiLogExecution('DEBUG', 'After Update Day', day);
        		//nlapiLogExecution('DEBUG', 'After Update Hour', hour);
        		//nlapiLogExecution('DEBUG', 'After Update Minute', minute);
        		
        		var archFolder = year.toString() + month.toString() + day.toString() + '_' + hour.toString() + minute.toString();
        		nlapiLogExecution('DEBUG', 'Archive Folder Name', archFolder);
        		
        		var folder = nlapiCreateRecord('folder');

        	    if (folder){

        	    	folder.setFieldValue('parent', EMAIL_ATTACH_FOLDER_ARCHIVE); //Root Level Folder
        	        folder.setFieldValue('name', archFolder);

        	        var folderId = nlapiSubmitRecord(folder);

        	    }
        		
        		//Move Existing Files to Newly Created Archive Folder
        		for (var i = 0; i < existFilesSearch.length; i++){
        			
        			var archiveFileId = existFilesSearch[i].getValue('internalid');
        			nlapiLogExecution('DEBUG', 'Archive File: ' + archiveFileId, 'In Folder: ' + folderId);
        			
        			var fileRec = nlapiLoadFile(archiveFileId);
        			fileRec.setFolder(folderId);
        			nlapiSubmitFile(fileRec);
        			//nlapiDeleteFile(delFileId);
        			
        		}//End for i loop
        		
        	}//End if (existFilesSearch)
        	
        	
        	//Put new files, if any, into the File Cabinet - to be attached to emails
        	file1 = request.getFile('custpage_file1');
        	nlapiLogExecution('DEBUG', 'file1', file1);
        	if (!isEmpty(file1)){
        		file1.setFolder(EMAIL_ATTACH_FOLDER);
            	var file1Id = nlapiSubmitFile(file1);
        	}
        	
        	file2 = request.getFile('custpage_file2');
        	nlapiLogExecution('DEBUG', 'file2', file2);
        	if (!isEmpty(file2)){
        		file2.setFolder(EMAIL_ATTACH_FOLDER);
            	var file2Id = nlapiSubmitFile(file2);
        	}
        	
        	file3 = request.getFile('custpage_file3');
        	nlapiLogExecution('DEBUG', 'file3', file3);
        	if (!isEmpty(file3)){
        		file3.setFolder(EMAIL_ATTACH_FOLDER);
            	var file3Id = nlapiSubmitFile(file3);
        	}
        	
        	file4 = request.getFile('custpage_file4');
        	nlapiLogExecution('DEBUG', 'file4', file4);
        	if (!isEmpty(file4)){
        		file4.setFolder(EMAIL_ATTACH_FOLDER);
            	var file4Id = nlapiSubmitFile(file4);
        	}
        	
        	file5 = request.getFile('custpage_file5');
        	nlapiLogExecution('DEBUG', 'file5', file5);
        	if (!isEmpty(file5)){
        		file5.setFolder(EMAIL_ATTACH_FOLDER);
            	var file5Id = nlapiSubmitFile(file5);
        	}
        	
        	
        	//var scriptSched = nlapiScheduleScript('customscript_scg_sendemailtocustomers_ss', 'customdeploy_scg_sendemailtocustomers_ss', {'custscript_subsidiary_ids': JSON.stringify(splitSubsids), 'custscript_template_id': template});
        	var scriptSched = nlapiScheduleScript('customscript_scg_sendemailtocustomers_ss', 'customdeploy_scg_sendemailtocustomers_ss', {'custscript_subsidiary_ids': splitSubsids, 'custscript_template_id': template, 'custscript_reprocess': reprocess, 'custscript_date_last_sale_from': lastSaleFrom, 'custscript_date_last_sale_to': lastSaleTo, 'custscript_ler_email_blast': lerEmailBlast, 'custscript_incl_disabled_email_custs': inclDisabledEmailCusts});
            nlapiLogExecution('DEBUG', 'Deployment Scheduled: ' + ' Status: ' + scriptSched, '');
            //nlapiSetRedirectURL('TASKLINK', 'LIST_SCRIPTSTATUS', null, null, {'scripttype': is_setc_getScriptInternalId('customscript_scg_sendemailtocusts_ss')});
            nlapiSetRedirectURL('TASKLINK', 'LIST_SCRIPTSTATUS', null, null, {'scripttype': is_setc_getScriptInternalId('customscript_scg_sendemailtocustomers_ss')});
            
            
        } catch (e) {
            is_setc_logError(e);
            throw e;
        }
    }
}


/**
 * Returns the internal id of the given script
 *
 * @appliedtorecord script
 *
 * @param {Array} scriptId: identifier given to this script
 * @returns {Integer}
 */
function is_setc_getScriptInternalId(scriptId) {
    // Initialize variables
    var scriptInternalId = '';

    // Define filters
    var filters = new Array();
    filters.push(new nlobjSearchFilter('scriptid', null, 'is', scriptId));

    // Define columns
    var columns = new Array();
    columns.push(new nlobjSearchColumn('name', null, null));

    // Get results
    var results = nlapiSearchRecord('script', null, filters, columns);
    if (results && results.length > 0) {
        scriptInternalId = results[0].getId();
    }

    // Return
    return scriptInternalId;
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}





function getExistingFiles(EMAIL_ATTACH_FOLDER){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('folder', null, 'anyof', EMAIL_ATTACH_FOLDER));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('file', null, filters, columns);
	  
	// Return
	return results;
	
}





