module.exports = function (grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*']
    });
    require('time-grunt')(grunt);

    var config = {
        src: 'src',
        spec: 'spec',
        web: 'web',
        pkg: require('./package.json'),
        banner: grunt.file.read('./LICENSE_BANNER'),
        jsFiles: module.exports.jsFiles,
        colaWorkerFiles: [
            'src/generate_objects.js',
            'src/cola.worker.js'
        ],
        dagreWorkerFiles: [
            'src/generate_objects.js',
            'src/dagre.worker.js'
        ]
    };

    grunt.initConfig({
        conf: config,

        concat: {
            options : {
                process: true,
                sourceMap: true,
                banner : '<%= conf.banner %>'
            },
            main: {
                src: '<%= conf.jsFiles %>',
                dest: '<%= conf.pkg.name %>.js'
            },
            colaWorker: {
                src: '<%= conf.colaWorkerFiles %>',
                dest: '<%= conf.pkg.name %>.cola.worker.js'
            },
            dagreWorker: {
                src: '<%= conf.dagreWorkerFiles %>',
                dest: '<%= conf.pkg.name %>.dagre.worker.js'
            }
        },
        uglify: {
            jsmin: {
                options: {
                    mangle: true,
                    compress: true,
                    sourceMap: true,
                    banner : '<%= conf.banner %>'
                },
                src: '<%= conf.pkg.name %>.js',
                dest: '<%= conf.pkg.name %>.min.js'
            }
        },
        jscs: {
            old: {
                src: ['<%= conf.spec %>/**/*.js'],
                options: {
                    validateIndentation: 4
                }
            },
            source: {
                src: ['<%= conf.src %>/**/*.js', '!<%= conf.src %>/{banner,footer}.js', 'Gruntfile.js',
                    'grunt/*.js', '<%= conf.web %>/stock.js'],
                options: {
                    config: '.jscsrc'
                }
            }
        },
        jshint: {
            source: {
                src: ['<%= conf.src %>/**/*.js', 'Gruntfile.js', 'grunt/*.js', '<%= conf.web %>/stock.js'],
                options: {
                    jshintrc: '.jshintrc',
                    ignores: ['<%= conf.src %>/banner.js', '<%= conf.src %>/footer.js']
                }
            }
        },
        watch: {
            scripts: {
                files: ['<%= conf.src %>/**/*.js', 'dc.graph.css'],
                tasks: ['docs']
            },
            reload: {
                files: ['<%= conf.pkg.name %>.js',
                    '<%= conf.pkg.name %>css',
                    '<%= conf.web %>/js/<%= conf.pkg.name %>.js',
                    '<%= conf.web %>/css/<%= conf.pkg.name %>.css',
                    '<%= conf.pkg.name %>.min.js'],
                options: {
                    livereload: true
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8888,
                    base: '.'
                }
            }
        },
        jsdoc2md: {
            dist: {
                src: 'dc.graph.js',
                dest: 'web/docs/api-latest.md'
            }
        },
        copy: {
            'dc-to-gh': {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            '<%= conf.pkg.name %>.css',
                            'node_modules/dc/dc.css',
                            'node_modules/font-awesome/css/font-awesome.css'
                        ],
                        dest: '<%= conf.web %>/css/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            '<%= conf.pkg.name %>.js',
                            '<%= conf.pkg.name %>.js.map',
                            '<%= conf.pkg.name %>.min.js',
                            '<%= conf.pkg.name %>.min.js.map',
                            '<%= conf.pkg.name %>.cola.worker.js',
                            '<%= conf.pkg.name %>.cola.worker.js.map',
                            '<%= conf.pkg.name %>.dagre.worker.js',
                            '<%= conf.pkg.name %>.dagre.worker.js.map',
                            'd3.flexdivs.js',
                            'dc.graph.tracker.domain.js',
                            'querystring.js',
                            'node_modules/crossfilter/crossfilter.js',
                            'node_modules/d3/d3.js',
                            'node_modules/dc/dc.js',
                            'node_modules/jquery/dist/jquery.js',
                            'node_modules/lodash/lodash.js',
                            'node_modules/queue-async/build/queue.js',
                            'node_modules/dagre/dist/dagre.js',
                            'node_modules/webcola/WebCola/cola.js'
                          ],
                        dest: '<%= conf.web %>/js/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'node_modules/font-awesome/fonts/*'
                        ],
                        dest: '<%= conf.web %>/fonts/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: 'node_modules/d3-tip/index.js',
                        dest: '<%= conf.web %>/js/d3-tip/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: 'node_modules/d3-tip/examples/example-styles.css',
                        dest: '<%= conf.web %>/css/d3-tip/'
                    }
                ]
            }
        },
        'gh-pages': {
            options: {
                base: '<%= conf.web %>',
                message: 'Synced from from master branch.'
            },
            src: ['**']
        },
        shell: {
            merge: {
                command: function (pr) {
                    return [
                        'git fetch origin',
                        'git checkout master',
                        'git reset --hard origin/master',
                        'git fetch origin',
                        'git merge --no-ff origin/pr/' + pr + ' -m \'Merge pull request #' + pr + '\''
                    ].join('&&');
                },
                options: {
                    stdout: true,
                    failOnError: true
                }
            },
            amend: {
                command: 'git commit -a --amend --no-edit',
                options: {
                    stdout: true,
                    failOnError: true
                }
            },
            hooks: {
                command: 'cp -n scripts/pre-commit.sh .git/hooks/pre-commit' +
                    ' || echo \'Cowardly refusing to overwrite your existing git pre-commit hook.\''
            }
        },
        browserify: {
            dev: {
                src: '<%= conf.pkg.name %>.js',
                dest: 'bundle.js',
                options: {
                    browserifyOptions: {
                        standalone: 'dc'
                    }
                }
            }
        }
    });

    // custom tasks
    grunt.registerTask('merge', 'Merge a github pull request.', function (pr) {
        grunt.log.writeln('Merge Github Pull Request #' + pr);
        grunt.task.run(['shell:merge:' + pr, 'test' , 'shell:amend']);
    });
    grunt.registerTask('test-stock-example', 'Test a new rendering of the stock example web page against a ' +
        'baseline rendering', function (option) {
            require('./regression/stock-regression-test.js').testStockExample(this.async(), option === 'diff');
        });
    grunt.registerTask('update-stock-example', 'Update the baseline stock example web page.', function () {
        require('./regression/stock-regression-test.js').updateStockExample(this.async());
    });

    // task aliases
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('docs', ['build', 'copy', 'jsdoc2md']);
    grunt.registerTask('web', ['docs', 'gh-pages']);
    grunt.registerTask('server', ['docs', 'connect:server', 'watch:scripts']);
    grunt.registerTask('lint', ['build', 'jshint', 'jscs']);
    grunt.registerTask('jsdoc', ['build', 'jsdoc2md', 'watch:jsdoc2md']);
    grunt.registerTask('default', ['build', 'shell:hooks']);
};

module.exports.jsFiles = [
    'src/banner.js',   // NOTE: keep this first
    'src/core.js',
    'src/depth_first_traversal.js',
    'src/generate_objects.js',
    'src/shape.js',
    'src/diagram.js',
    'src/legend.js',
    'src/constraint_pattern.js',
    'src/tree_constraints.js',
    'src/tree_positions.js',
    'src/behavior.js',
    'src/tip.js',
    'src/highlight_neighbors.js',
    'src/highlight_paths_group.js',
    'src/highlight_paths.js',
    'src/expand_collapse.js',
    'src/load_graph.js',
    'src/munge_graph.js',
    'src/flat_group.js',
    'src/convert_nest.js',
    'src/path_reader.js',
    'src/path_selector.js',
    'src/generate.js',
    'src/type_graph.js',
    'src/footer.js'  // NOTE: keep this last
];
