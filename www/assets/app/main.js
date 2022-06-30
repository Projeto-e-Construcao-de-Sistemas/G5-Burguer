(function(root,factory){if(typeof define==='function'&&define.amd){define(['jquery'],factory)}else{root.mainApp=factory(root,window.jQuery||window.$)}}(typeof self!=='undefined'?self:this,function(root,$){'use strict';const selfURI=$(document.currentScript).attr('src').substring(0,$(document.currentScript).attr('src').search('main.js')-1);let ajaxCount=0;let ajaxQueue=[];let alertTimeout=3000;let dialogOnClose=null;let dialogTheme='modern';let hashsDisabled=!1;let hashsMatch=[];let isGoingBack=!1;let iconClose='fa fa-times';let iconError='fa fa-2x fa-times text-danger';let iconSuccess='fa fa-2x fa-check text-success';let loadingNotifications=!1;let notificationsPage=0;let unseenNotifications=0;const mainBodyEvt=$('#main-body');const addOverlay=function(target,configModal={}){const element=$(target);let{bgOpacity,modalContent,modalClassCustom}=configModal;if(element.prop('data-overlay')==='1'){return}
const divElm=document.createElement('div');const iElm=document.createElement('i');const nodeName=element.prop('nodeName');const setOpacity=(bgOpacity!==undefined)?bgOpacity:.6;const setContent=(modalContent!==undefined)?`<div class="dyn-overlay_content">${modalContent}</div>`:'';if(nodeName==='BODY'){$('body').css({'overflow':'hidden'})}
$(divElm).addClass(['dyn-overlay',modalClassCustom]).css({'position':nodeName==='BODY'?'fixed':'absolute','top':'0','right':'0','bottom':'0','left':'0','display':'flex','justify-content':'center','align-items':'center','flex-direction':'column','z-index':nodeName==='BODY'?'6000':'','background':`rgba(255, 255, 255,${setOpacity})`,}).append(iElm).append(setContent);$(iElm).css({'display':'inline-block','width':'30px','height':'30px','border':'3px solid #dedede','border-top-color':'#333','border-radius':'100%','animation':'spin 1s infinite linear',});element.append(divElm).prop('data-overlay','1')};const ajax=(settings,noErrorMsg=!1)=>{const successCallback=settings.success?settings.success:()=>{};const errorCallback=settings.error?settings.error:()=>{};const completeCallback=settings.complete?settings.complete:()=>{};if(!settings.url){return!1}
if(!settings.method&&!settings.type){settings.method='GET'}
if(settings.queue&&ajaxCount>0){ajaxQueue.push(settings);return}
settings.success=(data,textStatus,jqXHR)=>{if(data&&data.error){showError((data.message!==null&&data.message)?data.message:'Opa! Algo não saiu como esperado.')}
successCallback(data,textStatus,jqXHR)};settings.error=(jqXHR,textStatus,errorThrown)=>{if(settings.modalLoading){$(settings.modalLoading).modal('hide')}
if(!noErrorMsg){ajaxError(jqXHR,textStatus,errorThrown)}
errorCallback(jqXHR,textStatus,errorThrown)};settings.complete=()=>{ajaxCount-=1;if(ajaxQueue.length){ajax(ajaxQueue.shift())}
completeCallback()};if(settings.dataType==='json'||settings.dataType==='jsonp'){settings.data=JSON.stringify(settings.data);settings.contentType='application/json'}
settings.url=restfulUrl(settings.url);settings.jsonp=!1;ajaxCount+=1;if(settings.modalLoading){$(settings.modalLoading).modal('show')}
$.ajax(settings)};const ajaxError=(jqXHR,textStatus,errorThrown)=>{showError(ajaxErrorMessage(jqXHR,textStatus,errorThrown))};const ajaxErrorMessage=function(jqXHR,textStatus,errorThrown){let obj;const defaultMessages={'abort':'Ação interrompida pelo usuário.','parsererror':'Não foi possível processar sua requisição.','timeout':'O servidor não respondeu à requisição.<br>Tente novamente e se o problema persistor, entre em contato com nosso suporte.'};if(defaultMessages[textStatus]){return defaultMessages[textStatus]}
if(textStatus!=='error'){return'Ocorreu algum erro não previsto.<br>Tente novamente e se o problema persistor, entre em contato com nosso suporte.'}
if(jqXHR.status===0){return'Falha na conexão com o servidor.<br>Por favor, verifique sua conexão de rede.'}
try{obj=jqXHR.responseJSON;if(obj&&obj.message){return obj.message}
return `${textStatus} : ${errorThrown}<br>${jqXHR.responseText}`}catch(e){return `${errorThrown}<br>${jqXHR.responseText}`}};const checkAnchor=()=>{if(isGoingBack){isGoingBack=!1;return}
const hash=location.hash;const res=hashsMatch.find(elm=>{const isExp=(typeof elm.expression==='object');const match=isExp?hash.match(elm.expression):(hash===elm.expression);return elm.enabled&&match&&typeof elm.callBack==='function'});if(res){res.callBack(hash.match(res.expression))}};const createCookie=function(name,value,days,seconds){let expires='';let date=new Date();if(seconds){date.setTime(date.getTime()+(seconds*1000));expires='; expires='+date.toUTCString()}
if(days){date.setTime(date.getTime()+(days*24*60*60*1000));expires='; expires='+date.toUTCString()}
document.cookie=encodeURIComponent(name)+'='+encodeURIComponent(value)+expires+'; path=/'};const dateFromISO=date=>{const vdt=date===null?[]:date.split(/[- T:]/);const dateObj=(date===null)?new Date():new Date(vdt[0]||0,(vdt[1]||1)-1,vdt[2]||0,vdt[3]||0,vdt[4]||0,vdt[5]||0);const currOfs=(new Date()).getTimezoneOffset();if(dateObj.getTimezoneOffset()!==currOfs&&vdt.length>3){dateObj.setTime(dateObj.getTime()+(dateObj.getTimezoneOffset()-currOfs)*60000)}
return dateObj};const deleteCookie=function(name){let expires='Thu, 01 Jan 1970 00:00:00 UTC';document.cookie=encodeURIComponent(name)+'=; expires='+expires+'; path=/'};const deleteOverlay=function(element){if(element==='body'){$('body').removeAttr('style')}
$(element).prop('data-overlay','').find('.dyn-overlay').remove()};const disableHashs=function(){if(hashsDisabled){return}
$.each(hashsMatch,idx=>{hashsMatch[idx].enabled=!1});hashsDisabled=!0};const enableHashs=hash=>{hashsMatch.forEach((elm,idx)=>{if(hash){if(String(hash)===String(elm.expression)){hashsMatch[idx].enabled=!0}
return}
hashsMatch[idx].enabled=!0});hashsDisabled=!1};const formatDateTime=(format,dateTime)=>{if(typeof dateTime==='object'){return $.formatDateTime(format,dateTime)}
if(typeof dateTime!=='undefined'&&dateTime!==null&&dateTime!==''){return $.formatDateTime(format,dateFromISO(dateTime))}
return''};const formatDateTimeBR=(format,dateTime)=>{let vdt;if(typeof dateTime==='object'){return $.formatDateTime(format,dateTime)}
if(typeof dateTime!=='undefined'&&dateTime!==null&&dateTime!==''){vdt=dateTime.split(/[-/ :]/);return $.formatDateTime(format,new Date(vdt[2],vdt[1]-1,vdt[0],vdt[3]||0,vdt[4]||0,vdt[5]||0))}
return''};const readCookie=function(name){const nameEQ=encodeURIComponent(name)+'=';let cookieValue=null;$.each(document.cookie.split(';'),(index,cookie)=>{const chr=$.trim(cookie);if(chr.indexOf(nameEQ)===0){cookieValue=decodeURIComponent(chr.substring(nameEQ.length,chr.length))}});return cookieValue};const registerHash=function(hash,callback){hashsMatch.push({expression:hash,callBack:callback,enabled:!0,})};const restfulUrl=link=>{const fullUrl=new RegExp('^http(s)?://.+');const shortUrl=new RegExp('^/api/.+');const baseUrl=new URL(`/api/${link}`,selfURI);if(fullUrl.test(link)||shortUrl.test(link)){return link}
return baseUrl.href};const unregisterHash=function(hash){hashsMatch.forEach((elm,idx)=>{if(String(hash)===String(elm.expression)){hashsMatch.splice(idx,1);return}})};const closeCurrentModal=function(){$.each($('.modal'),function(ids,modal){if(($(modal).data('bs.modal')||{}).isShown){$(modal).modal('hide');return}})};const loadImages=function(){$('[data-js="urlRealSrc"]').each(function(idx,item){var obj=$(item);if(obj.attr('realsrcset')){obj.attr('srcset',obj.attr('realsrcset'));obj.removeAttr('realsrcset')}})};const successfullIn=function(result){if(result.ccid){createCookie('ccid',result.ccid,90)}
if(result.redirect){location.href=result.redirect;return!1}
if(typeof mainApp.signinCallback==='function'){deleteOverlay('body');mainApp.signinCallback();return!1}
location.reload()};const setCursorEnd=ctrl=>{const pos=ctrl.value.length;if(ctrl.setSelectionRange){ctrl.focus();ctrl.setSelectionRange(pos,pos);return}
if(ctrl.createTextRange){const range=ctrl.createTextRange();range.collapse(!0);range.moveEnd('character',pos);range.moveStart('character',pos);range.select()}};const setFocus=function(selector){if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream){return}
if($(selector).is(':visible')){$(selector).focus()}};const checkAlertOptions=function(options){if(typeof options!=='object'){options={message:options,iconClass:iconSuccess,className:'alert-info',timeout:3000,onClose:null}}
if(typeof options.className==='undefined'){options.className='alert-info'}
if(typeof options.timeout==='undefined'){options.timeout=3000}
if(typeof options.onClose==='undefined'){options.onClose=null}
return options};const showAlert=function(options){var alertBox=document.createElement('div');var button=document.createElement('button');var times=document.createElement('span');options=checkAlertOptions(options);$(times).attr('aria-hidden','true').html('&times');$(button).attr({'type':'button','data-dismiss':'alert','aria-label':'Fechar'}).addClass('close').append(times);$(button).on('click',function(){$(this).parent().remove()});$(alertBox).addClass('alert alert-dismissible '+options.className).attr('role','alert').css({opacity:0}).html(options.message).prepend(button);$('.content-wrapper > .content').prepend(alertBox);$('.bof-container.l-wrap').prepend(alertBox);$(alertBox).animate({opacity:1},500,'swing',function(){timeoutRemoveAlert(alertBox,options.timeout,options.onClose)})};const timeoutRemoveAlert=function(alertObj,timeout,onClose){if(!timeout){return}
setTimeout(function(){$(alertObj).animate({opacity:0,},500,'swing',function(){if(typeof onClose==='function'){onClose()}
$(alertObj).remove()})},timeout)};const showUpperAlertBox=function(options){var obj=document.createElement('div');if(typeof options==='undefined'||options===null){return}
if(typeof options!=='object'){options={message:options,type:'success',iconClass:iconSuccess,timeout:alertTimeout,onClose:null}}
if(typeof options.onClose==='undefined'){options.onClose=null}
if(typeof options.iconClass!=='undefined'&&options.iconClass){$(obj).prepend($('<i>').addClass(options.iconClass))}
$(obj).appendTo(document.body);setTimeout(function(){$(obj).addClass('visible');timeoutRemoveAlertBox(obj,options.timeout,options.onClose)},50)};const timeoutRemoveAlertBox=function(alertObj,timeout,onClose){if(typeof timeout==='undefined'||timeout===null){timeout=alertTimeout}
setTimeout(function(){$(alertObj).removeClass('visible');setTimeout(function(){$(alertObj).remove();if(typeof onClose==='function'){onClose()}},500)},timeout)};const showDialogMessage=function(options){if(typeof $.dialog==='undefined'){return!1}
$.confirm(options);return!0};const showError=function(message,options){const buildMessage=(message)=>{if(Array.isArray(message)){return'<ul style="list-style:none;padding:0;"><li>'+message.join('</li><li>')+'</li></ul>'}
return message};let dialogOptions={backgroundDismissAnimation:'glow',icon:iconError,title:'',closeIcon:!0,closeIconClass:iconClose,columnClass:'medium',content:buildMessage(message),theme:dialogTheme,onClose:dialogOnClose,buttons:{ok:{btnClass:'hidden'}}};for(var attr in options){dialogOptions[attr]=options[attr]}
if(showDialogMessage(dialogOptions)){return}
showAlert({message:message,className:'alert-danger text-center',timeout:60000,onClose:null})};const showSuccess=function(message,options){var dialogOptions={backgroundDismissAnimation:'glow',icon:iconSuccess,title:'',closeIcon:!0,closeIconClass:iconClose,columnClass:'medium',content:message,theme:dialogTheme,onClose:dialogOnClose,buttons:{ok:{btnClass:'hidden'}}};for(var attr in options){dialogOptions[attr]=options[attr]}
if(showDialogMessage(dialogOptions)){return}
showAlert({message:message,className:'alert-success text-center',timeout:60000,onClose:null})};const slugGenerator=str=>{const from='àáâãåäªèéëêÆæìíïîòóöôõºðŒØøœùúüûµÑñç¢Ð£ßŠ§šýÿ¥ž¹²³·/_,:;';const to='aaaaaaaeeeeeeiiiiooooooooooouuuuunnccdlssssyyyz123------';str=str.replace(/^\s+|\s+$/g,'');str=str.toLowerCase();from.split('').forEach((char,index)=>{str=str.replace(new RegExp(char,'g'),to.charAt(index))});str=str.replace(/[^a-z0-9 -]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');return str};$.cachedScript=function(url,options){options=$.extend(options||{},{dataType:'script',cache:!0,url:url});return $.ajax(options)};window.addEventListener('hashchange',checkAnchor);$.fn.extend({inputNumber:function(options={}){this.each(function(){const elm=$(this);const min=elm.attr('min')||0;elm.inputmask('decimal',$.objectNormalizer(options,{allowMinus:min<0,allowPlus:!1,autoUnmask:!0,digits:elm.attr('data-decimals')||2,digitsOptional:!1,groupSeparator:'.',radixPoint:',',inputtype:'decimal',min:min,max:elm.attr('max'),prefix:elm.attr('data-prefix'),suffix:elm.attr('data-suffix'),unmaskAsNumber:!0,})).on('focus',()=>{elm.select()}).on('blur',()=>{if(elm.attr('min')&&typeof elm[0].value=='string'){elm[0].value=parseFloat(elm.attr('min'))}})})},zipEdit:function(successCallback=()=>{}){return $(this).inputmask('99999-999',{placeholder:'00000-000',clearIncomplete:!0,autoUnmask:!0,inputmodel:'numeric',onBeforeMask:value=>{return value.replace(/\D/g,'')},onBeforePaste:pastedValue=>{return pastedValue.replace(/\D/g,'')},onUnMask:(maskedValue,unmaskedValue)=>{return unmaskedValue.replace(/\D/g,'')},}).on('input paste',evt=>{const elm=$(evt.target);const zip=elm.inputmask('unmaskedvalue').replace(/\D/g,'');if(!elm.inputmask('isComplete')){return}
mainApp.ajax({url:`addresses/findZipCode/${zip}`,method:'GET',success:successCallback,error:()=>{elm.val('')}})}).on('focus',function(){$(this).select()})},});$.map(['addClass','toggleClass','removeClass'],function(method){var originalMethod=$.fn[method];$.fn[method]=function(){if(this.length===0){return originalMethod.apply(this,arguments)}
var oldClass=this[0].className;var result=originalMethod.apply(this,arguments);var newClass=this[0].className;this.trigger(method,[oldClass,newClass]);return result}});$.brDateFormat=(value,format='yy-mm-dd')=>{return formatDateTimeBR(format,value)};$.brlFormat=value=>{return'R$'+$.number(value,2,',','.')};$.formatZIP=value=>{const zipnumber=value?value.replace(/\D/g,''):'';if(zipnumber.length!==8){return value}
return zipnumber.replace(/(\d{5})(\d{3})/g,'$1-$2')};$.int2dec=(value,decimalPlaces)=>{if(value===null){return''}
return parseFloat(parseInt(value,10)/(10**decimalPlaces))};$.normalizeData=(model,data)=>{const newObj=Object.assign({},data);for(var name in model){if(!Object.prototype.hasOwnProperty.call(newObj,name)){if(Array.isArray(model[name])){newObj[name]=[...model[name]];continue}else if(model[name]===null){newObj[name]=model[name];continue}else if(typeof model[name]==='object'){newObj[name]=Object.assign({},model[name]);continue}
newObj[name]=model[name];continue}else if(typeof model[name]==='object'&&model[name]!==null&&!Array.isArray(model[name])){newObj[name]=$.normalizeData(model[name],newObj[name])}}
return newObj};$.objectNormalizer=(data,model,conversor)=>{const newdata=$.normalizeData(model,data);const keys=(typeof conversor==='object')?Object.keys(conversor):[];keys.forEach(key=>{newdata[key]=conversor[key](newdata[key])});return newdata};$.inputNumber=()=>{$('[data-input="number"]').inputNumber()};$.randomId=()=>{return Math.random().toString(36).substring(2,18)};root.addOverlay=addOverlay;root.checkAnchor=checkAnchor;root.dateFromISO=dateFromISO;root.deleteOverlay=deleteOverlay;root.restfulUrl=restfulUrl;root.setCursorEnd=setCursorEnd;root.slugGenerator=slugGenerator;return{urlControllers:selfURI,dependencies:[],plugins:{},signinCallback:null,alertTimeout:alertTimeout,dataTablesTranslation:function(i18n){var translations={'pt-BR':{'sEmptyTable':'Nenhum registro encontrado','sInfo':'Mostrando de _START_ até _END_ de _TOTAL_ registros','sInfoEmpty':'Mostrando 0 até 0 de 0 registros','sInfoFiltered':'(Filtrados de _MAX_ registros)','sInfoPostFix':'','sInfoThousands':'.','sLengthMenu':'_MENU_ resultados por página','sLoadingRecords':'Carregando...','sProcessing':'Processando...','sZeroRecords':'Nenhum registro encontrado','sSearch':'Pesquisar','oPaginate':{'sNext':'Próximo','sPrevious':'Anterior','sFirst':'Primeiro','sLast':'Último'},'oAria':{'sSortAscending':': Ordenar colunas de forma ascendente','sSortDescending':': Ordenar colunas de forma descendente'}}};if(translations[i18n]===undefined){return{'sEmptyTable':'No data available in table','sInfo':'Showing _START_ to _END_ of _TOTAL_ entries','sInfoEmpty':'Showing 0 to 0 of 0 entries','sInfoFiltered':'(filtered from _MAX_ total entries)','sInfoPostFix':'','sInfoThousands':',','sLengthMenu':'Show _MENU_ entries','sLoadingRecords':'Loading...','sProcessing':'Processing...','sSearch':'Search:','sZeroRecords':'No matching records found','oPaginate':{'sFirst':'First','sLast':'Last','sNext':'Next','sPrevious':'Previous'},'oAria':{'sSortAscending':': activate to sort column ascending','sSortDescending':': activate to sort column descending'}}}
return translations[i18n]},setCloseDialogCallback:function(callback){dialogOnClose=callback},getDialogTheme:function(){return dialogTheme},setDialogTheme:function(theme){dialogTheme=theme},getIconError:function(){return iconError},setIconClose:function(icon){iconClose=icon},setIconError:function(icon){iconError=icon},getIconSuccess:function(){return iconSuccess},setIconSuccess:function(icon){iconSuccess=icon},createCookie:createCookie,deleteCookie:deleteCookie,readCookie:readCookie,setFocus:setFocus,formatDate:date=>{return formatDateTime('dd/mm/yy',date)},formatDateTime:date=>{return formatDateTime('dd/mm/yy hh:ii',date)},formatDateTimeSecs:date=>{return formatDateTime('dd/mm/yy hh:ii:ss',date)},closeOpenedModal:closeCurrentModal,loadImages:loadImages,appleCheck:function(){return(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream)},showError:showError,showSuccess:showSuccess,ajax:ajax,ajaxError:ajaxError,ajaxErrorMessage:ajaxErrorMessage,registerHash:registerHash,slideToTop:function(){var slideToTop=$('<div />');slideToTop.html('<i class="fa fa-chevron-up"></i>');slideToTop.css({'position':'fixed','bottom':'20px','right':'25px','width':'40px','height':'40px','color':'#eee','font-size':'','line-height':'40px','text-align':'center','background-color':'#222d32','cursor':'pointer','border-radius':'5px','z-index':'99999','opacity':'.7','display':'none'});slideToTop.on('mouseenter',function(){$(this).css('opacity','1')});slideToTop.on('mouseout',function(){$(this).css('opacity','.7')});$('.wrapper').append(slideToTop);$(window).scroll(function(){if($(window).scrollTop()>=150){if(!$(slideToTop).is(':visible')){$(slideToTop).fadeIn(500)}}else{$(slideToTop).fadeOut(500)}});$(slideToTop).click(function(){$('html, body').animate({scrollTop:0},500)})},showAlert:showUpperAlertBox,showErrorAlert:function(text){if(typeof text==='undefined'||text===null){return}
showUpperAlertBox({message:text,type:'danger',iconClass:iconError,timeout:alertTimeout,onClose:null})},showSuccessAlert:function(text){if(typeof text==='undefined'||text===null){return}
showUpperAlertBox({message:text,type:'success',iconClass:iconSuccess,timeout:alertTimeout,onClose:null})},testEmail:function(email){return/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)},loadPlugin:function(name,url){$.cachedScript(url).done(()=>{if(!Object.prototype.hasOwnProperty.call(this.plugins,name)){console.warn(`Plugin ${name} not loaded`);return}
try{if(typeof this.plugins[name]==='function'){this.plugins[name]();return}
if(typeof this.plugins[name]==='object'){this.plugins[name].init();return}
console.warn(`Invalid plugin ${name} struct`)}catch(error){console.error(error)}})},waitPluginLoad:function(pluginName,callBack){if(typeof mainApp[pluginName]!=='undefined'){callBack();return}
setTimeout(function(){mainApp.waitPluginLoad(pluginName,callBack)},500)},loadController:function(controllerName,parameters){if(!controllerName){return}
$.cachedScript(controllerName).done(()=>{if(typeof this.controller==='function'){this.controller(parameters);checkAnchor();return}
if(typeof this.controller!=='object'){return}
this.controller.init(parameters);checkAnchor()})},init:function(options){const style=document.createElement('style');style.innerHTML='@keyframes spin {from {transform: rotate(0deg);} to {transform: rotate(360deg);}}';document.getElementsByTagName('head')[0].appendChild(style);this.loadController(options.controller,options.options);checkAnchor();loadImages()}}}))