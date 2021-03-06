'use strict';
var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;
var nodePath = require('path');
var util = require('./util');
var outputDir = nodePath.join(__dirname, 'build');
require('app-module-path').addPath(nodePath.join(__dirname, 'src'));
describe('optimizer/plugins', function() {
    beforeEach(function(done) {
        util.rmdirRecursive(outputDir);
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        require('raptor-promises').enableLongStacks();
        require('raptor-logging').configureLoggers({
            'optimizer': 'WARN',
            'raptor-cache': 'WARN'
        });
        done();
    });

    it('should only read a dependency once during optimization', function(done) {
        var optimizer = require('../');

        var plugin = require('./plugins/foo-plugin');

        var pageOptimizer = optimizer.create({
            fileWriter: {
                outputDir: outputDir,
                fingerprintsEnabled: false
            },
            plugins: [
                {
                    plugin: plugin
                }
            ]
        }, nodePath.join(__dirname, 'test-bundling-project'), __filename);

        var writerTracker = require('./WriterTracker').create(pageOptimizer.writer);
        pageOptimizer.optimizePage({
                pageName: 'testPage',
                dependencies: [
                        'hello.foo'
                    ],
                from: nodePath.join(__dirname, 'test-plugins-project')
            },
            function(err, optimizedPage) {
                if (err) {
                    return done(err);
                }

                var fooCode = writerTracker.getCodeForFilename('testPage.js');
                expect(fooCode).to.equal('HELLO WORLD\n');
                expect(plugin.counter).to.equal(1);
                plugin.counter = 0; // Reset the counter
                done();
            });
    });

});
