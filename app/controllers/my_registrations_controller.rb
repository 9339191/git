class MyRegistrationsController < ApplicationController
  include AllowDelegateViewAs
  before_filter :api_authenticate

  def get_feed
      render json: MyRegistrations::MyRegistrations.from_session(session).get_feed_as_json
  end

end
