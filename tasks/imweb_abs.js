/**
 * @fileoverview 绝对路径替换
 * @author casperchen（名字替换掉 <----）
 */

'use strict';


module.exports = function(grunt) {

	var path = require('path');
	var Util = require('../lib/util')(grunt);

	// 将代码同步到一个目录里，作用：客户端本地化
	grunt.task.registerMultiTask('imweb_abs', '将相对路径改成绝对路径', function(){
		var $config = this.options({
			jsCDNRoot: '',
			cssCDNRoot: '',
			imgCDNRoot: '',
			jsVersion: '',
			cssVersion: '',
			distPath: ''
		});
		$config.distPath = $config.root;

		var jsCDNRoot = $config.jsCDNRoot;
		var cssCDNRoot = $config.cssCDNRoot;
		var imgCDNRoot = $config.imgCDNRoot;

		var jsVersion = $config.jsVersion;
		var cssVersion = $config.cssVersion;

		grunt.log.debug('将相对路径改成绝对路径！-----------------------');

		// var htmlFiles = grunt.file.expand($config.distPath+'**/*.html');
		var htmlFiles = this.filesSrc;
		htmlFiles.forEach(function(filepath, index){
			var fileContent = grunt.file.read(filepath);    // html文件内容

			fileContent = Util.textReplace(fileContent, [{
				// 替换script路径
				from: /<script(.+)src=["'](([^\/]+)\/([^"']+))["']/g,
				to: function (matchedWord, index, fullText, regexMatches) {

					var src = regexMatches[1],
						ret = '';

					grunt.log.debug('HTML replace: find a <script> in '+filepath);
					grunt.log.debug('matchedWord: ' + matchedWord);
					grunt.log.debug('index: ' + index);

					grunt.log.debug('before replace: '+ matchedWord);

					if(src.match(/^https?/)){
						grunt.log.debug('绝对路径，不进行替换！');
						ret = matchedWord;
					}else{

						src = Util.getUrlRelativeToCertainFilepath(src, filepath, $config.distPath);
						ret = ('<script'+ regexMatches[0] + 'src="' + jsCDNRoot + src + '"')

						if(jsVersion){
							ret = ret.replace(/\/js\//, '/js/'+jsVersion+'/');
						}

					}
					grunt.log.debug('after replace: '+ret + '\n');

					return ret;
				}
			}, {
				from: /<link(.+)href=["']([^"']+)["']/g,
				to: function (matchedWord, index, fullText, regexMatches) {
					var href = regexMatches[1],
						ret = '';

					grunt.log.debug('HTML replace: find a <link> in '+filepath);
					grunt.log.debug('matchedWord: ' + matchedWord);
					grunt.log.debug('index: ' + index);
					// grunt.log.debug('regexMatches: ' + regexMatches);
					grunt.log.debug('before replace: '+ matchedWord);

					if(href.match(/^https?/)){
						grunt.log.debug('绝对路径，不进行替换！');
						ret = matchedWord;
					}else{

						if(href.indexOf('favicon.ico')==-1){    // favicon是特例，跟img的是同个路径
							href = Util.getUrlRelativeToCertainFilepath(href, filepath, $config.distPath);
							ret = ('<link'+ regexMatches[0] + 'href="' + cssCDNRoot + href + '"');

							if(cssVersion){
								ret = ret.replace(/\/css\//, '/css/'+cssVersion+'/');
							}

						}else{

							// var href = regexMatches[0];

							if(href.indexOf("$")>-1)return matchedWord;

							var imgFileFullPath = Util.getUrlRelativeToCertainFilepath(href, filepath, $config.distPath);
							// return     imgCDNRoot + imgFileFullPath;
							ret = matchedWord.replace(regexMatches[1], imgCDNRoot + imgFileFullPath);
						}

					}
					grunt.log.debug('after replace: '+ret + '\n');

					return ret;
				}
			}, {
				// 图片路径
				from: /<img.+src=["']([^"']+)["'].*\/?\s*>/g,
				to: function (matchedWord, index, fullText, regexMatches) {
					if(matchedWord.match('data:') || grunt.file.isPathAbsolute(matchedWord) || matchedWord.match(/https?/) || (regexMatches[0] || '').match(/about:blank/)){
						return matchedWord;
					}else{
						var src = regexMatches[0];

						if(src.indexOf("$")>-1)return matchedWord;

						var imgFileFullPath = Util.getUrlRelativeToCertainFilepath(src, filepath, $config.distPath);
						// return     imgCDNRoot + imgFileFullPath;
						return matchedWord.replace(regexMatches[0], imgCDNRoot + imgFileFullPath);
					}
				}
			}, {
				// data-main="modules/index/js/cb10.index"
				from: /(data\-main\=["'])([^"']+)(["'])/,
				to: function(matchedWord, index, fullText, regexMatches) {
					if(matchedWord.match('data:') || grunt.file.isPathAbsolute(matchedWord) || matchedWord.match(/https?/)){
						return matchedWord;
					}
					var ret = (regexMatches[0] + jsCDNRoot + regexMatches[1] + regexMatches[2])

					if(jsVersion){
						ret = ret.replace(/\/js\//, '/js/'+jsVersion+'/');
					}

					return ret;
				}
			},{
				from : /loadjs\.load\(\s*((?:\[[^\[\]]+\])|(?:['"][^'"]+['"]))/ig,//匹配loadjs模式
				to : function(matchedWord, index, fullText, regexMatches){
					//console.log(arguments);
					var ret = matchedWord.replace(/['"]([^'"]+)['"]/ig,function(){
						var href = arguments[1],
							_ret = '';
						if(href.match(/^https?/)){
							grunt.log.debug('绝对路径，不进行替换！');
							return arguments[0];
						}else{
							_ret = '"'+ jsCDNRoot + href +'"';
							//console.log(_ret);
							if(jsVersion){
								_ret = _ret.replace(/\/+js\/+/, '/js/'+jsVersion+'/');
							}
							return _ret;
						}
						return arguments[0];
					});
					grunt.log.debug('after loadjs replace: '+ret + '\n');
					return ret;
				}
			},{
				from : /\loadjs\.require\(\s*((?:\[[^\[\]]+\])|(?:['"][^'"]+['"]))/ig,//匹配$.require模式
				to : function(matchedWord, index, fullText, regexMatches){
					//console.log(arguments);
					var ret = matchedWord.replace(/['"]([^'"]+)['"]/ig,function(){
						var href = arguments[1],
							_ret = '';
						if(href.match(/^https?/)){
							grunt.log.debug('绝对路径，不进行替换！');
							return arguments[0];
						}else{
							_ret = '"'+ jsCDNRoot + href +'"';
							//console.log(_ret);
							if(jsVersion){
								_ret = _ret.replace(/\/+js\/+/, '/js/'+jsVersion+'/');
							}
							return _ret;
						}
						return arguments[0];
					});
					grunt.log.debug('after loadjs replace: '+ret + '\n');
					return ret;
				}
			},{
				from : /((?:\$\.(?:http\.)?file)|(?:loadfile))\(\s*['"]([^'"]+)['"]/ig,//匹配$.http.file模式
				to : function(matchedWord, index, fullText, regexMatches){
					var href = regexMatches[1],
						ret = '';
					grunt.log.debug('HTML replace: find a $.http.file in '+filepath);
					grunt.log.debug('matchedWord: ' + matchedWord);
					if(href.match(/^https?/)){
						grunt.log.debug('绝对路径，不进行替换！');
						ret = matchedWord;
					}else{
						var _match = href.match(/([^\/\/]+)\.(\w+[^?#])(\?[\w\W]*)?(#[\w\W]*)?$/);
						var type = _match && _match[2] || '';
						switch(type){
							case 'js':
								ret = (regexMatches[0] + '("'+ jsCDNRoot + href +'"');

								if(jsVersion){
									ret = ret.replace(/\/+js\/+/, '/js/'+jsVersion+'/');
								}
								break;
							case 'css':
								ret = (regexMatches[0] + '("'+ cssCDNRoot + href +'"');

								if(cssVersion){
									ret = ret.replace(/\/+css\/+/, '/css/'+cssVersion+'/');
								}
								break;
							default :
								ret = matchedWord;
								break;
						}


					}
					grunt.log.debug('after css file replace: '+ret + '\n');

					return ret;
				}
			}]);
			grunt.file.write(filepath, fileContent);
		});
	});
};
