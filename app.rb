require "sinatra/base"
require "json"
require "typeprof"
require "pathname"
require "stringio"
require "dalli"

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

  if ENV["RACK_ENV"] == "production"
    set :cache, Dalli::Client.new
  else
    DummyCache = {}
    class << DummyCache
      alias get []
      alias set []=
    end
    set :cache, DummyCache
  end

  get "/" do
    send_file File.join(__dir__, "docs/index.html")
  end

  if ENV["RACK_ENV"] == "production"
    get "/main.js" do
      send_file File.join(__dir__, "docs/main.js")
    end
  else
    get "/main.js" do
      content_type "application/javascript"
      File.read(File.join(__dir__, "docs/main.js")).sub("https://aluminium.ruby-lang.org/typeprof-playground", "")
    end
  end

  get "/style.css" do
    send_file File.join(__dir__, "docs/style.css")
  end

  MAX_SIZE = 2000

  post "/analyze" do
    req = request.body.read

    cache_key = "typeprof-playground:" + req

    res = settings.cache.get(cache_key)
    return res if res

    req = JSON.parse(req)

    rb_text = req["rb"] || ""
    rbs_text = req["rbs"] || ""

    if rb_text.size > MAX_SIZE || rbs_text.size > MAX_SIZE
      return JSON.generate({
        status: "error",
        message: "The input is too long",
      })
    end

    p req

    rb_files = [DummyPathname.new(rb_text, "test.rb")]
    rbs_files = [DummyPathname.new(rbs_text, "test.rbs")]
    output = StringIO.new("")
    options = { show_errors: true }
    config = TypeProf::ConfigData.new(rb_files: rb_files, rbs_files: rbs_files, output: output, max_sec: 5, options: options)
    TypeProf.analyze(config)
    output = output.string
    output << "\n\n"
    output << "## Version info:\n"
    output << "##   * Ruby: #{ RUBY_VERSION }\n"
    output << "##   * RBS: #{ RBS::VERSION }\n"
    output << "##   * TypeProf: #{ TypeProf::VERSION }\n"

    res = {
      status: "ok",
      output: output,
    }

    res = JSON.generate(res)

    settings.cache.set(cache_key, res)

    res
  end
end
