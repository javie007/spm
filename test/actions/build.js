var path = require('path');
var should = require('should');

require('../module.js');

var fsExt = require('../../lib/utils/fs_ext.js');
var spm = require('../../lib/spm.js'); // require('spm');
var depsPlugin = require('../../lib/plugins/dependencies.js');
var build = spm.getAction('build');

var moduleAdir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");
var invalidNameModuleDir = path.join(path.dirname(module.filename), "../data/modules/invalidName/");
var noDepsConfigModuleDir = path.join(path.dirname(module.filename), "../data/modules/noDepsConfig/");
var relativeModuleDir = path.join(path.dirname(module.filename), "../data/modules/relativeModule/");
var sampleModuleDir = path.join(path.dirname(module.filename), "../data/modules/sampleModule/");

describe('spm build', function() {

  describe('get module info', function() {
    it('module info', function() {
      getProjectModel(moduleAdir, function(moduleA) {
        should.exist(moduleA);
        moduleA.name.should.eql('moduleA');
        moduleA.version.should.eql('0.9.17');
      });
    });
  });
  

  describe('test unDepsConfig module build', function() {
    it('undepsconfig module info', function(done) {
      executeBuildAction(noDepsConfigModuleDir, function(model) {
        var distCodePath = path.join(model.distDirectory, 'module-debug.js');
        var moduleDebugCode = fsExt.readFileSync(distCodePath);

        should.exist(moduleDebugCode);

        var deps = depsPlugin.parseDependencies(null, moduleDebugCode);
        deps.forEach(function(dep) {
          /undefined/.test(dep).should.be.false;
        });
        done();
      });
    });
  });

  describe('test invalidName module build ', function() {
    it('invalidName module info', function(done) {
      executeBuildAction(invalidNameModuleDir, function(model) {
        var distCodePath = path.join(model.distDirectory, 'jquery.json-2.s-debug.js');
        var moduleDebugCode = fsExt.readFileSync(distCodePath);
        should.exist(moduleDebugCode);
        model.getModuleId('jquery.json-2.s.js').should.eql('invalidNameModule/0.0.1/jquery.json-2.s');
        var defineReg = /define\("invalidNameModule\/0\.0\.1\/jquery\.json-2\.s-debug/;
        defineReg.test(moduleDebugCode).should.be.true;
        done();
      });
    });
  });

  describe('test relative module build ', function() {
    it('relative module info', function(done) {
      executeBuildAction(relativeModuleDir, function(model) {
        model.name.should.eql('relativeModule');
        var moduleCPath = path.join(relativeModuleDir, 'dist', 'lib', 'c-debug.js');
        fsExt.existsSync(moduleCPath).should.be.true;
        
        var code = fsExt.readFileSync(moduleCPath);

        var cDefReg = /define\("relativeModule\/0.9.1\/lib\/c-debug", \["..\/core\/a-debug", "..\/core\/b-debug"\]/;
        var bDefReg = /define\("relativeModule\/0.9.1\/core\/b-debug", \[\]/;
        var aDefReg = /define\("relativeModule\/0.9.1\/core\/a-debug", \[".\/b-debug"\]/;
        code.should.match(cDefReg);
        code.should.match(bDefReg);
        code.should.match(aDefReg);
        done();
      });
    });
  });

  describe('test module which define contain space', function(done) {
    it('module which define contain space', function(done) {
      executeBuildAction(sampleModuleDir, function(model) {
        model.name.should.eql('sampleModule');
        var spaceDefinePath = path.join(sampleModuleDir, 'dist', 'spaceDefine-debug.js');
        var modulePath = path.join(sampleModuleDir, 'dist', 'module-debug.js');
        fsExt.existsSync(spaceDefinePath).should.be.true;
        fsExt.existsSync(modulePath).should.be.true;
        var code = fsExt.readFileSync(spaceDefinePath);
        var moduleCode = fsExt.readFileSync(modulePath);
        var sreg = /define\("sampleModule\/0.0.1\/spaceDefine-debug",/;
        var mreg = /define\("sampleModule\/0.0.1\/module-debug",/;
        code.should.match(sreg);
        moduleCode.should.match(mreg);
        done();
      });
    });
  });

  describe('test module require', function() {
    it('module require', function(done) {
      executeBuildAction(sampleModuleDir, function(model) {
        var modulePath = path.join(sampleModuleDir, 'dist', 'debugRequire-debug.js');
        fsExt.existsSync(modulePath).should.be.true;
        var code = fsExt.readFileSync(modulePath);

        var defineReg = /define\("sampleModule\/0.0.1\/debugRequire-debug", \[".\/module-debug"\]/;
        var requireReg1 = /require\('\.\/module-debug\.js'\)/;
        var requireReg2 = /require\('\.\/module-debug\.js'\)/;
        code.should.match(defineReg);
        code.should.match(requireReg1);
        code.should.match(requireReg2);
        done();
      });
    });
  });

  describe('test require async', function() {
    it('require async module code', function(done) {
      executeBuildAction(sampleModuleDir, function(model) {
        var modulePath = path.join(sampleModuleDir, 'dist', 'asyncRequire-debug.js');
        fsExt.existsSync(modulePath).should.be.true;
        
        var code = fsExt.readFileSync(modulePath);

        var defineReg = /define\("sampleModule\/0.0.1\/asyncRequire-debug", \[\]/;
        var requireReg1 = /require\.async\('\.\/module-debug\.js'\)/;
        var requireReg2 = /require\.async\('module-debug\.js'\)/;
        var requireReg2 = /require\.async\('$-debug'\)/;
        var requireReg2 = /require\.async\('arale\/base\/1.0.1\/base-debug'\)/;
        code.should.match(defineReg);
        code.should.match(requireReg1);
        code.should.match(requireReg2);
        done();
      });
    });
  });

  describe('options parse test', function() {
    it('test command arg read', function(done) {
      build.run({
        base: moduleAdir,
        'source-files': [],
        'extra-resources': ['test', 'example', 'src']
      }, function(model) {
        model.getConfig('extraResources').should.eql(['test', 'example', 'src'])
        model.getConfig('extra-resources').should.eql(['test', 'example', 'src'])
      console.info('-------->', model.getConfig('extra-resources'));
      done();
      }); 
    });
  
  });
});

function executeBuildAction(moduleDir, callback) {
  build.run({
    base: moduleDir,
    'source-files': []
  }, callback);
}
