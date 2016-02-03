class SearchUsersController < ApplicationController

  def search_users
    authorize(current_user, :can_view_as_for_all_uids?)
    users_found = User::SearchUsers.new(id: params['id']).search_users
    render json: { users: users_found }.to_json
  end

  def search_users_by_uid
    authorize(current_user, :can_view_as_for_all_uids?)
    users_found = User::SearchUsersByUid.new(id: params['id']).search_users_by_uid
    render json: { users: users_found }.to_json
  end

end
