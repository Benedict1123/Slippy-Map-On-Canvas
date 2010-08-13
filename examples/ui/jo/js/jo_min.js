
joLog=function(){if(typeof console==="undefined"||typeof console.log==="undefined"||!console.log)
return;var strings=[];for(var i=0;i<arguments.length;i++){strings.push(arguments[i]);}
console.log(strings.join(" "));}
Function.prototype.extend=function(superclass,proto){this.prototype=new superclass();if(proto){for(var i in proto)
this.prototype[i]=proto[i];}};if(typeof Function.prototype.bind==='undefined'){Function.prototype.bind=function(context){var self=this;function callbind(){return self.apply(context,arguments);}
return callbind;};}
jo={platform:"webkit",version:"0.0.1",useragent:['ipad','iphone','webos','android','opera','chrome','safari','mozilla','gecko','explorer'],load:function(call,context){joDOM.enable();this.loadEvent=new joSubject(this);this.unloadEvent=new joSubject(this);document.body.onMouseDown=function(e){e.preventDefault();};document.body.onDragStart=function(e){e.preventDefault();};if(typeof navigator=='object'&&navigator.userAgent){var agent=navigator.userAgent.toLowerCase();for(var i=0;i<this.useragent.length;i++){if(agent.indexOf(this.useragent[i])>=0){this.platform=this.useragent[i];break;}}}
if(joGesture)
joGesture.load();joLog("Jo",this.version,"loaded for",this.platform,"environment.");this.loadEvent.fire();},getPlatform:function(){return this.platform;},getVersion:function(){return this.version;},getLanguage:function(){return this.language;}};joDOM={enabled:false,get:function(id){if(typeof id=="string")
return document.getElementById(id);else
return(typeof id=='object'&&id.tagName)?id:null;},remove:function(node){if(node.parentNode){node.parentNode.removeChild(node);}},enable:function(){this.enabled=true;},getParentWithin:function(node,ancestor){while(node.parentNode!==window&&node.parentNode!==ancestor){node=node.parentNode;}
return node;},addCSSClass:function(node,classname){var n=node.className.split(/\s+/);for(var i=0,l=n.length;i<l;i++){if(n[i]==classname)
return;}
n.push(classname);node.className=n.join(" ");},removeCSSClass:function(node,classname,toggle){var n=node.className.split(/\s+/);for(var i=0,l=n.length;i<l;i++){if(n[i]==classname){if(l==1)
node.className="";else{n.splice(i,i);node.className=n.join(" ");}
return;}}
if(toggle){n.push(classname);node.className=n.join(" ");}},toggleCSSClass:function(node,classname){this.removeCSSClass(node,classname,true);},create:function(tag,style){if(!this.enabled)
return null;var o=document.createElement(tag);if(style)
this.setStyle(o,style);return o;},setStyle:function(node,style){if(typeof style==="string"){node.className=style;}
else if(typeof style==="object"){for(var i in style){switch(i){case"id":case"className":node[i]=style[i];break;default:node.style[i]=style[i];}}}
else if(typeof style!=="undefined"){throw("joDOM.setStyle(): unrecognized type for style argument; must be object or string.");}},applyCSS:function(style,oldnode){if(oldnode)
document.body.removeChild(oldnode);var css=joDOM.create('jostyle');css.innerHTML="<style>"+style+"</style>";document.body.appendChild(css);return css;},loadCSS:function(filename,oldnode){if(oldnode)
var css=oldnode;else
var css=joDOM.create('link');css.rel='stylesheet';css.type='text/css';css.href=filename;document.body.appendChild(css);return css;}};joEvent={getTarget:function(e){if(!e)
var e=window.event;return e.target?e.target:e.srcElement;},on:function(element,event,call,context,data){if(!call||!element)
return;var element=joDOM.get(element);var call=call;var data=data||"";var wrappercall=function(e){var target=joEvent.getTarget(e);if(context)
call.call(context,e,data);else
call(e,data);};if(!window.addEventListener)
element.attachEvent("on"+event,wrappercall);else
element.addEventListener(event,wrappercall,false);},stop:function(e){if(e.stopPropagation)
e.stopPropagation();else
e.cancelBubble=true;},preventDefault:function(e){e.preventDefault();},block:function(e){if(window.event)
var e=window.event;if(typeof e.target=='undefined')
e.target=e.srcElement;switch(e.target.nodeName.toLowerCase()){case'input':case'textarea':return true;break;default:return false;}}};joSubject=function(subject){this.subscriptions=[];this.subject=subject;};joSubject.prototype={subscribe:function(call,observer,data){if(!call)
return false;var o={"call":call};if(observer)
o.observer=observer;if(data)
o.data=data;this.subscriptions.push(o);return true;},unsubscribe:function(call,observer){if(!call)
return false;for(var i=0,l=this.subscriptions.length;i<l;i++){if(this.subscriptions[i].call===call&&(this.subscriptions[i].observer=="undefined"||this.subscriptions[i].observer===observer))
this.subscriptions[i].slice(i,1);}},fire:function(data){if(typeof data=='undefined')
var data="";for(var i=0,l=this.subscriptions.length;i<l;i++){var subjectdata=(typeof this.subscriptions[i].data!=='undefined')?this.subscriptions[i].data:null;if(this.subscriptions[i].observer){this.subscriptions[i].call.call(this.subscriptions[i].observer,data,this.subject,subjectdata);}
else{this.subscriptions[i].call(data,this.subject,subjectdata);}}}};function joYield(call,context,delay,data){if(!delay)
var delay=100;if(!context)
var context=this;var timer=window.setTimeout(function(){call.call(context,data);},delay);return timer;};joChain=function(){this.queue=[];this.active=false;this.addEvent=new joSubject("add",this);this.startEvent=new joSubject("start",this);this.stopEvent=new joSubject("stop",this);this.nextEvent=new joSubject("next",this);this.stop();this.delay=100;};joChain.prototype={add:function(call,context,data){if(!context)
var context=this;if(!data)
var data="";this.queue.push({"call":call,"context":context,"data":data});if(this.active&&!this.timer)
this.next();},start:function(){this.active=true;this.startEvent.fire();this.next();},stop:function(){this.active=false;if(this.timer!=null)
window.clearTimeout(this.timer);this.timer=null;this.stopEvent.fire();},next:function(){var nextcall=this.queue.shift();if(!nextcall){this.timer=null;return;}
this.nextEvent.fire(nextcall);nextcall.call.call(nextcall.context,nextcall.data);if(this.queue.length)
this.timer=joEvent.yield(this.next,this,this.delay);else
this.timer=null;}};joClipboard={data:"",get:function(){return joPreference.get("joClipboardData")||this.data;},set:function(clip){this.data=clip;joPreference.set("joClipboardData");}};joDatabase=function(datafile,size){this.openEvent=new joEvent.Subject(this);this.closeEvent=new joEvent.Subject(this);this.errorEvent=new joEvent.Subject(this);this.datafile=datafile;this.size=size||256000;this.db=null;};joDatabase.prototype={open:function(){this.db=openDatabase(this.datafile,"1.0",this.datafile,this.size);if(this.db){this.openEvent.fire();}
else{joLog("DataBase Error",this.db);this.errorEvent.fire();}},close:function(){this.db.close();this.closeEvent.fire();},now:function(offset){var date=new Date();if(offset)
date.setDate(date.valueOf()+(offset*1000*60*60*24));return date.format("yyyy-mm-dd");}};joDataSource=function(data){this.changeEvent=new joSubject(this);this.errorEvent=new joSubject(this);if(typeof data!=="undefined")
this.setData();else
this.data="";};joDataSource.prototype={setQuery:function(query){this.query=query;},getQuery:function(){return this.query;},setData:function(data){this.data=data;this.changeEvent.fire(data);},getData:function(){return this.data;},getDataCount:function(){return this.getData().length;},getPageCount:function(){if(this.pageSize)
return Math.floor(this.getData().length/this.pageSize)+1;else
return 1;},getPage:function(index){var start=index*this.pageSize;var end=start+this.pageSize;if(end>this.getData().length)
end=this.getData().length;if(start<0)
start=0;return this.data.slice(start,end);},refresh:function(){},setPageSize:function(length){this.pageSize=length;},getPageSze:function(){return this.pageSize;},load:function(){}};joSQLDataSource=function(db,query,args){this.db=db;this.query=(typeof query=='undefined')?"":query;this.args=(typeof args=='undefined')?[]:args;this.changeEvent=new joEvent.subject(this);this.errorEvent=new joEvent.subject(this);};joSQLDataSource.prototype={setDatabase:function(db){this.db=db;},setQuery:function(query){this.query=query;},setData:function(data){this.data=data;this.changeEvent.fire();},clear:function(){this.data=[];this.changeEvent.fire();},setParameters:function(args){this.args=args;},execute:function(query,args){this.setQuery(query||"");this.setParameters(args);if(this.query)
this.refresh();},refresh:function(){if(!this.db){this.errorEvent.fire();return;}
var self=this;if(arguments.length){var args=[];for(var i=0;i<arguments.length;i++)
args.push(arguments[i]);}
else{var args=this.args;}
var query=this.query;function success(t,result){self.data=[];for(var i=0,l=result.rows.length;i<l;i++){var row=result.rows.item(i);self.data.push(row);}
self.changeEvent.fire(self.data);}
function error(){joLog('SQL error',query,"argument count",args.length);self.errorEvent.fire();}
this.db.db.transaction(function(t){t.executeSql(query,args,success,error);});}};joPreference=function(data){this.preference=data||{};};joPreference.prototype={loadEvent:new joSubject(this),preference:{},setDataSource:function(source){this.dataSource=source;source.loadEvent.subscribe(this.load,this);},load:function(data){if(data instanceof Array){for(var i=0;i<data.length;i++)
this.set(data[i][0],data[i][1]);}
else if(typeof data==="object"){this.data=data;}},save:function(key){if(key){this.dataSource.set(key,this.data[key].get());}
else{for(var i in this.data){this.dataSource.set(i,this.data[i].get());}}},getNumber:function(key){return 0+this.get(key);},getBoolen:function(key){return 0+this.parseInt(this.get(key));},get:function(key){if(typeof this.preference[key]==='undefined')
return"";else
return this.preference[key].get();},setBoolean:function(key,value){this.set(key,(value)?1:0);},set:function(key,value){if(typeof this.preference[key]==='undefined')
this.preference[key]=new joDataSource(value);else
this.preference[key].set(value);this.save(key);},bind:function(key){var self=this;if(typeof this.preference[key]==='undefined')
return new joDataSource();else
return this.preference[key];}};joGesture={load:function(){this.upEvent=new joSubject(this);this.downEvent=new joSubject(this);this.leftEvent=new joSubject(this);this.rightEvent=new joSubject(this);this.forwardEvent=new joSubject(this);this.backEvent=new joSubject(this);this.homeEvent=new joSubject(this);this.closeEvent=new joSubject(this);this.activateEvent=new joSubject(this);this.deactivateEvent=new joSubject(this);this.setEvents();},setEvents:function(){joEvent.on(document.body,"keydown",this.onKeyDown,this);joEvent.on(document.body,"keyup",this.onKeyUp,this);},onKeyUp:function(e){if(!e)
var e=window.event;joLog("keyup",e.keyCode,e.charCode);if(e.keyCode==18){this.altkey=false;joLog("alt OFF");return;}
if(!this.altkey)
return;joEvent.stop(e);switch(e.keyCode){case 37:this.leftEvent.fire("left");break;case 38:this.upEvent.fire("up");break;case 39:this.rightEvent.fire("right");break;case 40:this.downEvent.fire("down");break;case 27:this.backEvent.fire("back");break;case 13:this.forwardEvent.fire("forward");break;}},onKeyDown:function(e){if(!e)
var e=window.event;joLog("keydown",e.keyCode,e.charCode);if(e.keyCode==27){this.backEvent.fire("back");return;}
if(e.keyCode==13&&joFocus.get()instanceof joInput){joEvent.stop(e);return;}
if(e.keyCode==18){joLog("alt ON");this.altkey=true;return;}}};joView=function(data){this.changeEvent=new joSubject(this);this.setContainer();if(data)
this.setData(data);};joView.prototype={getTag:function(){return this.tag;},getContainer:function(){return this.container;},setContainer:function(container){this.container=joDOM.get(container);if(!this.container)
this.container=this.createContainer();this.setEvents();},createContainer:function(tag,classname){return joDOM.create(tag||"joview",classname);},clear:function(){this.data="";if(this.container)
this.container.innerHTML="";this.changeEvent.fire();},setData:function(data){this.data=data;this.refresh();},getData:function(){return this.data;},refresh:function(){if(!this.container||typeof this.data=="undefined")
return 0;this.container.innerHTML="";this.draw();this.changeEvent.fire(this.data);},draw:function(){this.container.innerHTML=this.data;},setStyle:function(style){joDOM.setStyle(this.container,style);},setEvents:function(){}};joContainer=function(data){joView.apply(this,arguments);};joContainer.extend(joView,{createContainer:function(tag,classname){return joDOM.create(tag||"jocontainer",classname);},getContent:function(){return this.container.childNodes;},setData:function(data){this.data=data;this.refresh();},activate:function(){},deactivate:function(){},push:function(data){if(typeof data==='object'){if(data instanceof Array){for(var i=0;i<data.length;i++)
this.push(data[i]);}
else if(data instanceof joView&&data.container!==this.container){this.container.appendChild(data.container);}
else if(data instanceof Object){this.container.appendChild(data);}}
else{var o=document.createElement("div");o.innerHTML=data;this.container.appendChild(o);}},refresh:function(){this.container.innerHTML="";this.draw();},draw:function(){this.push(this.data);}});joCard=function(data){joContainer.apply(this,arguments);};joCard.extend(joContainer,{createContainer:function(){return joDOM.create("jocard");}});joGroup=function(data){joContainer.apply(this,arguments);};joGroup.extend(joContainer,{createContainer:function(){return joDOM.create("jogroup");}});joFooter=function(data){joContainer.apply(this,arguments);};joFooter.extend(joContainer,{createContainer:function(){return joDOM.create("jofooter");}});joStack=function(data){this.visible=false;joView.apply(this,arguments);this.setLocked(true);this.pushEvent=new joSubject(this);this.popEvent=new joSubject(this);this.homeEvent=new joSubject(this);this.showEvent=new joSubject(this);this.hideEvent=new joSubject(this);this.data=[];this.index=0;};joStack.extend(joView,{setEvents:function(){},onClick:function(e){joEvent.stop(e);},forward:function(){if(this.index<this.data.length-1){this.index++;this.draw();}},back:function(){if(this.index>0){this.index--;this.draw();}},draw:function(){if(!this.container)
this.createContainer();if(this.container.childNodes&&this.container.childNodes.length){this.container.innerHTML="";}
var o=this.data[this.index];if(!o)
return;if(o.container){this.container.appendChild(o.container);if(typeof o.activate!=='undefined')
o.activate();}
else{this.container.appendChild(o);}
this.container.scrollTop="0";},isVisible:function(){return this.visible;},push:function(o){this.data.push(o);this.index=this.data.length-1;this.draw();this.pushEvent.fire(o);},setLocked:function(state){this.locked=(state)?1:0;},pop:function(){if(this.data.length>this.locked){var o=this.data.pop();this.index=this.data.length-1;this.draw();if(typeof o.deactivate!=='undefined')
o.deactivate();if(!this.data.length)
this.hide();}
if(this.data.length>0)
this.popEvent.fire();},home:function(o){if(this.data&&this.data.length){var o=this.data[0];this.data=[];this.data.push(o);this.draw();this.homeEvent.fire();}},showHome:function(){this.home();if(!this.visible){this.visible=true;joDOM.addCSSClass(this.container,"show");this.showEvent.fire();}},show:function(){if(!this.visible){this.visible=true;joDOM.addCSSClass(this.container,"show");joYield(this.showEvent.fire,this.showEvent,500);}},hide:function(){if(this.visible){this.visible=false;joDOM.removeCSSClass(this.container,"show");joYield(this.hideEvent.fire,this.hideEvent,500);}},createContainer:function(tag,classname){return joDOM.create(tag||"jostack",classname);}});joScroller=function(data){this.points=[];joContainer.apply(this,arguments);};joScroller.velocity=10;joScroller.extend(joContainer,{setEvents:function(){joEvent.on(this.container,"mousedown",this.onDown,this);joEvent.on(this.container,"mouseup",this.onUp,this);joEvent.on(this.container,"mousemove",this.onMove,this);joEvent.on(this.container,"mouseout",this.onOut,this);},onFlick:function(e){var str="";for(var i in e)
str+="; "+i+"="+e[i];},onDown:function(e){joEvent.stop(e);this.points=[];this.points.unshift(this.getMouse(e));this.inMotion=true;this.quickSnap=false;jsDOM.removeCSSClass(this.data,"flick");jsDOM.removeCSSClass(this.data,"flickback");},onMove:function(e){e.preventDefault();if(this.inMotion){var point=this.getMouse(e);var y=point.y-this.points[0].y;this.points.unshift(point);if(this.points.length>5)
this.points.pop();this.scrollBy(y,true);}},onOut:function(e){},onUp:function(e){if(!this.inMotion)
return;joEvent.stop(e);this.inMotion=false;var dy=0;for(var i=0;i<this.points.length-1;i++)
dy+=(this.points[i].y-this.points[i+1].y);if(this.points.length>4)
e.preventDefault();if(Math.abs(dy)>5&&!this.quickSnap){joDOM.addCSSClass(this.data,"flick");var flick=dy*(this.data.offsetHeight/this.container.offsetHeight);this.scrollBy(flick,false);joYield(this.snapBack,this,1000);}
else{this.snapBack();}},getMouse:function(e){return{x:e.screenX,y:e.screenY};},scrollToElement:function(e){},scrollBy:function(y,test){var top=this.data.offsetTop;if(isNaN(top))
top=0;var dy=Math.floor(top+y);if(this.data.offsetHeight<=this.container.offsetHeight)
return;var max=0-this.data.offsetHeight+this.container.offsetHeight;var bump=Math.floor(this.container.offsetHeight*0.2);var ody=dy;if(dy>bump)
dy=bump;else if(dy<max-bump)
dy=max-bump;if(test){if(ody!=dy)
this.quickSnap=true;else
this.quickSnap=false;}
if(this.data.offsetTop!=dy)
this.data.style.top=dy+"px";},snapBack:function(){var top=parseInt(this.data.style.top);if(isNaN(top))
top=0;var dy=top;var max=0-this.data.offsetHeight+this.container.offsetHeight;jsDOM.removeCSSClass(this.data,'flick');jsDOM.addCSSClass(this.data,'flickback');if(dy>0)
this.data.style.top="0px";else if(dy<max)
this.data.style.top=max+"px";}});joControl=function(data){this.selectEvent=new joSubject(this);this.enabled=true;if(data instanceof joDataSource){joView.call(this);this.setDataSource(data);}
else{joView.apply(this,arguments);}};joControl.extend(joView,{setEvents:function(){joEvent.on(this.container,"click",this.onMouseDown,this);joEvent.on(this.container,"blur",this.onBlur,this);joEvent.on(this.container,"focus",this.onFocus,this);},onMouseDown:function(e){this.select(e);},select:function(e){if(e)
joEvent.stop(e);this.selectEvent.fire(this.data);},enable:function(){joDOM.removeCSSClass(this.container,'disabled');this.container.contentEditable=true;this.enabled=true;},disable:function(){joDOM.addCSSClass(this.container,'disabled');this.container.contentEditable=false;this.enabled=false;},onFocus:function(e){joLog("onFocus",this.data);joEvent.stop(e);joFocus.set(this);},onBlur:function(e){joLog("onBlur",this.data);joEvent.stop(e);this.blur();},focus:function(e){joDOM.addCSSClass(this.container,'focus');if(!e)
this.container.focus();},blur:function(){joDOM.removeCSSClass(this.container,'focus');},setDataSource:function(source){this.dataSource=source;source.changeEvent.subscribe(this.setData,this);}});joButton=function(data,classname){joControl.apply(this,arguments);if(classname)
this.container.className=classname;};joButton.extend(joControl,{createContainer:function(tag,classname){var o=joDOM.create(tag||"jobutton",classname);o.setAttribute("tabindex","1");return o;},enable:function(){this.container.setAttribute("tabindex","1");joControl.prototype.enable.call(this);},disable:function(){this.container.removeAttribute("tabindex");joControl.prototype.disable.call(this);}});joInput=function(data){joControl.apply(this,arguments);};joInput.extend(joControl,{setData:function(data){if(data!==this.data){this.data=data;this.container.innerHTML=data;this.changeEvent.fire(this.data);}},enable:function(){this.container.setAttribute("tabindex","1");joControl.prototype.enable.call(this);},disable:function(){this.container.removeAttribute("tabindex");joControl.prototype.disable.call(this);},createContainer:function(tag,classname){var o=joDOM.create(tag||"joinput",classname);if(!o)
return;o.setAttribute("type","text");o.setAttribute("tabindex","1");o.contentEditable=this.enabled;return o;},setEvents:function(){joControl.prototype.setEvents.call(this);joEvent.on(this.container,"keydown",this.onKeyDown,this);},onKeyDown:function(e){if(e.keyCode==13){e.preventDefault();joEvent.stop(e);}
return false;},onMouseDown:function(e){joEvent.stop(e);this.focus();},storeData:function(){this.data=this.container.innerHTML;if(this.dataSource)
this.dataSource.set(this.value);}});joFocus={last:null,set:function(control){if(this.last&&this.last!==control)
this.last.blur();if(control&&control instanceof joControl){control.focus();this.last=control;}},get:function(control){return this.last;},refresh:function(){joLog("joFocus.refresh()");if(this.last)
this.last.focus();},clear:function(){this.set();}};joList=function(container,data){this.autoSort=false;this.lastNode=null;this.index=0;joControl.apply(this,arguments);};joList.extend(joControl,{setDefault:function(msg){this.defaultMessage=msg;},createContainer:function(tag,classname){return joDOM.create(tag||"jolist",classname);},draw:function(){var html="";var length=0;if(this.data.length==0&&typeof this.defaultMessage!="undefined"){this.container.innerHTML=this.defaultMessage;return;}
for(var i=0,l=this.data.length;i<l;i++){var element=this.formatItem(this.data[i],i,length);if(element==null)
continue;if(typeof element=="string")
html+=element;else
this.container.appendChild(element);++length;}
if(html.length)
this.container.innerHTML=html;return;},deselect:function(){if(typeof this.container=='undefined'||!this.container['childNodes'])
return;var node=this.container.childNodes[this.index];if(node){if(this.lastNode)
joDOM.removeCSSClass(this.lastNode,"selected");}},setIndex:function(index,silent){this.index=index;if(typeof this.container=='undefined'||!this.container['childNodes'])
return;var node=this.container.childNodes[this.index];if(node){if(this.lastNode)
joDOM.removeCSSClass(this.lastNode,"selected");joDOM.addCSSClass(node,"selected");this.lastNode=node;}
if(index>=0&&!silent)
this.fireSelect(index);},fireSelect:function(index){this.selectEvent.fire(index);},getIndex:function(){return this.index;},onMouseDown:function(e){var node=joDOM.getParentWithin(joEvent.getTarget(e),this.container);var index=this.getNodeIndex(node);if(index>=0){joEvent.stop(e);this.setIndex(index);}},refresh:function(){this.index=0;this.lastNode=null;if(this.autoSort)
this.sort();joControl.prototype.refresh.apply(this);},getNodeData:function(index){if(this.data&&this.data.length&&index>=0&&index<this.data.length)
return this.data[index];else
return null;},getLength:function(){return this.length||this.data.length||0;},sort:function(){this.data.sort(this.compareItems);},getNodeIndex:function(element){var index=element.getAttribute('index');if(index)
return parseInt(index)
else
return-1;},formatItem:function(itemData){var element=document.createElement('li');element.innerHTML=itemData;return element;},compareItems:function(a,b){if(a>b)
return 1;else if(a==b)
return 0;else
return-1;},setAutoSort:function(state){this.autoSort=state;},next:function(){if(this.getIndex()<this.getLength()-1)
this.setIndex(this.index+1);},prev:function(){if(this.getIndex()>0)
this.setIndex(this.index-1);}});joTabBar=function(){joList.apply(this,arguments);};joTabBar.extend(joList,{formatItem:function(data,index){var o=document.createElement("li");if(data.label)
o.innerHTML=data.label;if(data.type)
o.className=data.type;o.setAttribute("index",index);return o;},createContainer:function(tag,classname){return joDOM.create(tag||"jolist",classname);}});joTitle=function(data){joControl.apply(this,arguments);};joTitle.extend(joControl,{createContainer:function(){return joDOM.create("jotitle");}});joCaption=function(data){joControl.apply(this,arguments);};joCaption.extend(joControl,{createContainer:function(){return joDOM.create("jocaption");}});joHTML=function(data){joControl.apply(this,arguments);};joHTML.extend(joControl,{createContainer:function(){return joDOM.create("johtml");},setEvents:function(){joEvent.on(this.container,"click",this.onClick,this);},onClick:function(e){joEvent.stop(e);joEvent.preventDefault(e);var container=this.container;var hrefnode=findhref(joEvent.getTarget(e));if(hrefnode){this.selectEvent.fire(hrefnode.href);}
function findhref(node){if(node.href)
return node;if(typeof node.parentNode!=="undefined"&&node.parentNode!==container)
return findhref(node.parentNode);else
return null;}}});joMenu=function(data){joList.apply(this,arguments);};joMenu.extend(joList,{createContainer:function(){return joDOM.create("jomenu");},fireSelect:function(index){if(typeof this.data[index].id!=="undefined"&&this.data[index].id)
this.selectEvent.fire(this.data[index].id);else
this.selectEvent.fire(index);},formatItem:function(item,index){var o=joDOM.create("jomenuitem");o.setAttribute("index",index);o.innerHTML=((item.icon)?'<img src="'+item.icon+'">':"")+'<jomenutitle>'+item.title+'</jomenutitle>';return o;}});joSound=function(filename,loop){if(typeof Audio=='undefined')
return;this.filename=filename;this.audio=new Audio();if(!this.audio)
return;this.audio.src=filename;this.audio.autoplay=false;this.audio.load();this.pause();if(loop)
joEvent.on(this.audio,"ended",this.play,this);};joSound.prototype={play:function(){if(!this.audio)
return;this.audio.play();},pause:function(){if(!this.audio)
return;this.audio.pause();},rewind:function(){if(!this.audio)
return;try{this.audio.currentTime=0.0;}
catch(e){joLog("joSound: can't rewind...");}},stop:function(){this.pause();this.rewind();},setVolume:function(vol){if(!this.audio)
return;this.audio.volume=vol;}};joPasswordInput=function(data){joInput.apply(this,arguments);};joPasswordInput.extend(joInput,{createContainer:function(){return joInput.prototype.createContainer.call(this,"joinput","password");}});joDivider=function(data){joView.apply(this,arguments);};joDivider.extend(joView,{createContainer:function(){return joDOM.create("jodivider");}});joLabel=function(data){joControl.apply(this,arguments);};joLabel.extend(joControl,{createContainer:function(){return joDOM.create("jolabel");}});