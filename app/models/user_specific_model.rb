class UserSpecificModel
  include ActiveAttr::Model
  include ClassLogger
  attr_reader :authentication_state

  def self.from_session(session_state)
    filtered_session = {
      'original_user_id' => session_state['original_user_id'],
      'original_delegate_user_id' => session_state['original_delegate_user_id'],
      'lti_authenticated_only' => session_state['lti_authenticated_only']
    }
    self.new(session_state['user_id'], filtered_session)
  end

  def initialize(uid, options={})
    @uid = uid
    @options = options
    @authentication_state = AuthenticationState.new @options.merge('user_id' => @uid)
  end

  def instance_key
    @uid
  end

  def directly_authenticated?
    @authentication_state.directly_authenticated?
  end

  def delegate_permissions
    @authentication_state.delegate_permissions
  end

end
