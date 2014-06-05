require 'selenium-webdriver'
require 'page-object'
require_relative '../util/web_driver_utils'
require_relative '../util/user_utils'

module CalCentralPages

  include PageObject

  # Header
  link(:my_dashboard_link, :text => 'My Dashboard')
  link(:my_academics_link, :text => 'My Academics')
  link(:my_campus_link, :text => 'My Campus')
  link(:my_finances_link, :text => 'My Finances')

  # Settings, Log Out
  link(:gear_link, :xpath => '//i[@class="fa fa-cog"]')
  button(:settings_link, :xpath => '//button[@data-ng-click="api.popover.clickThrough(\'Gear - Settings\');api.util.redirect(\'settings\')"]')
  button(:logout_link, :xpath => '//button[contains(text(),"Log out")]')

  # Footer
  div(:toggle_footer_link, :xpath => '//div[@class=\'cc-footer-berkeley\']')
  button(:opt_out_button, :xpath => '//button[text()="Opt out of CalCentral"]')
  button(:opt_out_yes, :xpath => '//button[text()="Yes"]')
  button(:out_out_no, :xpath => '//button[text()="No"]')
  text_field(:basic_auth_uid_input, :name => 'email')
  text_field(:basic_auth_password_input, :name => 'password')
  button(:basic_auth_login_button, :xpath => '//button[contains(text(),"Login")]')

  def click_my_dashboard_link
    Rails.logger.info('Clicking My Dashboard link')
    my_dashboard_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    my_dashboard_link
  end

  def click_my_academics_link
    Rails.logger.info('Clicking My Academics link')
    my_academics_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    my_academics_link
  end

  def click_my_campus_link
    Rails.logger.info('Clicking My Campus link')
    my_campus_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    my_campus_link
  end

  def click_my_finances_link
    Rails.logger.info('Clicking My Finances link')
    my_finances_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    my_finances_link
  end

  def click_settings_link
    Rails.logger.info('Clicking the link to the Settings page')
    gear_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    gear_link
    settings_link
  end

  def click_logout_link
    Rails.logger.info('Logging out of CalCentral')
    gear_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    gear_link
    logout_link
  end

  def opt_out(driver)
    Rails.logger.info('Opting out of CalCentral')
    toggle_footer_link_element.when_visible(timeout=WebDriverUtils.page_event_timeout)
    driver.find_element(:xpath, '//div[@class=\'cc-footer-berkeley\']').click
    opt_out_button_element.when_visible(timeout=WebDriverUtils.page_event_timeout)
    opt_out_button
    opt_out_yes_element.when_visible(timeout=WebDriverUtils.page_event_timeout)
    opt_out_yes
  end

  def basic_auth(driver, uid)
    Rails.logger.info('Logging in using basic auth')
    toggle_footer_link_element.when_visible(timeout=WebDriverUtils.page_load_timeout)
    driver.find_element(:xpath, '//div[@class=\'cc-footer-berkeley\']').click
    basic_auth_uid_input_element.when_visible(timeout=WebDriverUtils.page_event_timeout)
    self.basic_auth_uid_input = uid
    self.basic_auth_password_input = UserUtils.basic_auth_pass
    basic_auth_login_button
    basic_auth_uid_input_element.when_not_present(timeout=WebDriverUtils.page_load_timeout)
  end

end
