module CalCentralPages

  class SplashPage

    include PageObject
    include CalCentralPages
    include ClassLogger

    wait_for_expected_title('Home | CalCentral', WebDriverUtils.page_load_timeout)
    button(:sign_in, :xpath => '//button[@data-ng-click="api.user.signIn()"]')

    def load_page
      logger.info('Loading splash page')
      navigate_to WebDriverUtils.base_url
    end

    def click_sign_in_button
      WebDriverUtils.wait_for_page_and_click sign_in_element
    end

  end
end
