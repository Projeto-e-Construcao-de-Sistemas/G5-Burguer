(function(root,factory){if(typeof define==='function'&&define.amd){define(['jquery'],factory)}else if(root.mainApp.controller){root.mainApp.controller.module=factory(mainApp.controller,window.jQuery||window.$)}else if(root.mainApp){root.mainApp.controller=factory(mainApp,window.jQuery||window.$)}else{console.error('Main application was not loaded')}}(typeof self!=='undefined'?self:this,function(parent,$){'use strict';const edtName=$('#edit-name');const edtType=$('#edit-type');const edtSituation=$('#edit-situation');const edtPrice=$('#edit-price');const edtDesc=$('#edit-description');const productImg=$('#product-image');const dataModel={'id':0,'type':0,'situation':0,'name':'','description':'','price':0,'name':'','path':'',};const dataConv={'price':val=>val===null?0:parseFloat(val),'type':val=>parseInt(val,10),'situation':val=>parseInt(val,10),'description':val=>val||'','name':val=>val||'','path':val=>val||'',};const inpId=$('#record-id');let currentRecord=$.objectNormalizer(dataModel,dataModel);const buildPayload=()=>{return{'name':edtName.val().trim(),'price':edtPrice.val()?edtPrice.val():null,'situation':edtSituation.val()?edtSituation.val():null,'description':edtDesc.val().trim(),'type':edtType.val(),'path':productImg.attr('src')?productImg.attr('src'):null}};$('#input-file-upload').fileupload({url:restfulUrl('products/saveImage'),dataType:'json',singleFileUploads:!0,autoUpload:!0,acceptFileTypes:/(\.|\/)(jpe?g|png)$/i,maxFileSize:5000000,downloadTemplateId:null,uploadTemplateId:null,maxNumberOfFiles:1}).on('fileuploadprocessalways',(e,data)=>{const index=data.index;const file=data.files[index];if(file.error){switch(file.error){case 'File type not allowed':mainApp.showError('Este tipo de arquivo não é permitido');return;case 'File is too large':mainApp.showError('Arquivo muito grande. O limite é de 5MB.');return;case 'File is too small':mainApp.showError('Arquivo muito pequeno.');return;case 'Maximum number of files exceeded':mainApp.showError('Máximo de 1 arquivo.');return}
mainApp.showError(file.error)}}).on('fileuploaddone',(e,data)=>{data.result.files.forEach(file=>{if(file.path){productImg.attr('src','http://burguer.devlocal.com.br/assets/productImages/'+file.path)}else if(file.error){var error=$('<span class="text-danger"/>').text(file.error);imagePanel.children().append('<br>').append(error);btnUploadAvatar.text('ERRO!').prop('disabled',!0)}})}).on('fileuploadfail',(e,data)=>{if(typeof data.jqXHR==='object'&&data.jqXHR.status>=400){mainApp.ajaxError(data.jqXHR,'error',data.errorThrown);return}
if(data.errorThrown){mainApp.showError(data.errorThrown);return}}).prop('disabled',!$.support.fileInput).parent().addClass($.support.fileInput?'':'disabled');const callSpecialMethod=(command,message)=>{mainApp.ajax({url:`products/${currentRecord.id}/${command}`,method:'PUT',dataType:'json',success:result=>{setRecord(result);fillEditForm();history.back();$.success(`Produto ${message} com sucesso.`)},error:()=>history.back()})};const confirmations=()=>{return{delete:{title:'Exclusão',content:`Confirma a exclusão definitiva do produto<br><strong>${currentRecord.name}</strong>?`,action:()=>{mainApp.ajax({url:`products/${currentRecord.id}`,method:'DELETE',success:()=>{location.hash=''},error:()=>history.back()})}},}};const fillEditForm=()=>{productImg.attr('src',currentRecord.path);inpId.text(currentRecord.id||'0');edtName.val(currentRecord.name);edtType.val(currentRecord.type);edtSituation.val(currentRecord.situation);edtPrice[0].value=parseFloat(currentRecord.price);edtDesc.val(currentRecord.description);if(currentRecord.path!==''){productImg.attr('src','http://burguer.devlocal.com.br/assets/productImages/'+currentRecord.path)}};const numberFormat=(number,precision)=>{return $.number(number,precision,',','.')};const resetRecord=function(){setRecord(dataModel)};const setRecord=data=>{currentRecord=$.objectNormalizer(data,dataModel,dataConv)};$.inputNumber();const getRecord=(rowId,callback)=>{mainApp.ajax({url:`products/${rowId}`,method:'GET',data:{},success:result=>{console.log(result);setRecord(result);callback()},error:()=>{location.hash=''}})};return{actions:{'delete':()=>$.confirmAction(confirmations(),'delete'),},currentRecord:()=>currentRecord,dataTableObj:{ajax:{url:'products',method:'GET',},columns:[{data:'situation',className:'text-center text-nowrap',width:'1%',render:parent.productSituationIcon},{data:'type',className:'text-nowrap',render:parent.orderSituationText},{data:'name',className:'text-nowrap',render:(data,type,row)=>{if(type!=='display'){return data}
return htmlLink({href:`#${row.id}`,text:data||'[ produto sem nome ]'})}},{data:'price',orderable:!1,className:'text-right text-nowrap',render:(data,type)=>{if(type!=='display'){return data}
return $.brlFormat(data)},}],order:[[1,'asc']],stateSave:!1},fillDetails:fillEditForm,formChangeInspect:()=>{const original=$.objectNormalizer(currentRecord,currentRecord);const payload=$.objectNormalizer(buildPayload(),currentRecord,dataConv);let filePath=payload.path.split('/');payload.path=filePath[5];return!Object.isSimilar(original,payload)},formSave:()=>{const payload=buildPayload();let filePath=payload.path.split('/');payload.path=filePath[5];mainApp.ajax({url:'products'+(currentRecord.id?'/'+currentRecord.id:''),method:currentRecord.id?'PUT':'POST',data:payload,dataType:'json',success:result=>{setRecord(result);console.log(result);fillEditForm();$('#tab-log').find('table.dataTable').DataTable().draw();$.success('Produto salvo com sucesso.')}})},getRecord:getRecord,resetRecord:resetRecord,init:()=>{},}}))