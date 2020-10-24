require_relative "app"

require "rack/cors"

use Rack::Cors do
  allow do
    origins(ENV["RACK_ENV"] == "production" ? "mame.github.io" : "localhost:9292")
    resource("/analyze", headers: :any, methods: [:post, :options])
  end
end

run TypeProfPlayground
