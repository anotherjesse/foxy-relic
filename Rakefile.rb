require 'yaml'
require 'aws/s3'
require "active_support"

task :xpi do
  `rm -rf /tmp/xpi-relic`
  `mkdir -p /tmp/xpi-relic`
  `cp -r . /tmp/xpi-relic`

  build = "0.1.#{Time.now.to_i}"
  `cd /tmp/xpi-relic && sed -i 's/BUILD/#{build}/g' *.rdf`
  `cd /tmp/xpi-relic && find chrome chrome.manifest modules install.rdf | egrep -v "(~|#|\.git|\.idl)" | xargs zip relic.xpi`
  puts "Built version #{build}"
end

task :release => :xpi do
  begin
      keys = YAML::load_file("s3.yml")['connection'].symbolize_keys
  rescue
    raise "Could not load AWS s3.yml"
  end

  AWS::S3::Base.establish_connection!(keys)

  [{:file => '/tmp/xpi-relic/relic.xpi', :content_type => 'application/x-xpinstall'},
   {:file => '/tmp/xpi-relic/update-relic.rdf', :content_type => 'text/xml'}].each do |f|
    AWS::S3::S3Object.store(File.basename(f[:file]), open(f[:file]), 'overstimulate', :access => "public-read", :content_type => f[:content_type])
  end

  puts "Uploaded to S3"
end

task :default => :release
