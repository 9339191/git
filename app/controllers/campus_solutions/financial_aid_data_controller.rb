module CampusSolutions
  class FinancialAidDataController < CampusSolutionsController

    def get
      if current_user.authenticated_as_advisor?
        model = CampusSolutions::MyFinancialAidFilteredForAdvisor.from_session(session)
      else
        model = CampusSolutions::MyFinancialAidData.from_session(session)
      end
      model.aid_year = params['aid_year']
      render json: model.get_feed_as_json
    end

  end
end
