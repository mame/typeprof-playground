require "sinatra/base"
require "json"
require "typeprof"
require "pathname"
require "stringio"

class TypeProfPlayground < Sinatra::Base
  class DummyPathname < Pathname
    def initialize(content, name)
      @content = content
      @name = name
    end

    def file?
      true
    end

    def extname
      ".rbs"
    end

    def to_s
      @name
    end

    def read
      @content
    end
  end

  post "/analyze" do
    body = request.body.read
    request = JSON.parse(body)

    rb_text = request["rb"] || ""
    rbs_text = request["rbs"] || ""

    rb_files = [DummyPathname.new(rb_text, "test.rb")]
    rbs_files = [DummyPathname.new(rbs_text, "test.rbs")]
    output = StringIO.new("")
    options = { show_errors: true }
    config = TypeProf::ConfigData.new(rb_files: rb_files, rbs_files: rbs_files, output: output, options: options)
    TypeProf.analyze(config)
    output = config.output.string
    output << "\n\n"
    output << "## Version info:\n"
    output << "##   * Ruby: #{ RUBY_VERSION }\n"
    output << "##   * RBS: #{ RBS::VERSION }\n"
    output << "##   * TypeProf: #{ TypeProf::VERSION }\n"

    response = {
      status: "ok",
      out: output,
    }

    JSON.generate(response)

    # TODO: error handling
  end

  post "/report" do
    # ...

    response = {
      status: "ok",
    }

    JSON.generate(response)
  end
end
