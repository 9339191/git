describe UserSpecificModel do
  describe '#from_session' do
    subject { UserSpecificModel.from_session session_extras.merge({'user_id' => random_id}) }
    context 'when standard user session' do
      let(:session_extras) { {} }
      it 'should be directly_authenticated' do
        expect(subject.directly_authenticated?).to be true
        expect(subject.delegate_permissions).to be_empty
      end
    end
    context 'standard view-as mode' do
      let(:session_extras) {
        {
          'original_user_id' => random_id
        }
      }
      it 'should identify user as not directly_authenticated' do
        expect(subject.directly_authenticated?).to be false
        expect(subject.delegate_permissions).to be_empty
      end
    end
    context 'delegate view-as mode' do
      let(:session_extras) {
        {
          'original_delegate_user_id' => random_id
        }
      }
      before {
        permissions = ['Power-to-rule-the-Universe!']
        allow_any_instance_of(AuthenticationState).to receive(:delegate_permissions).and_return permissions
      }
      it 'should identify user as having delegate_permissions' do
        expect(subject.directly_authenticated?).to be false
        expect(subject.delegate_permissions).to_not be_empty
      end
    end
    context 'when only authenticated from an external app' do
      let(:session_extras) {
        {
          'lti_authenticated_only' => true
        }
      }
      it {
        expect(subject.directly_authenticated?).to be false
        expect(subject.delegate_permissions).to be_empty
      }
    end
  end
end
