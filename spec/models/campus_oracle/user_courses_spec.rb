require "spec_helper"

describe CampusOracle::UserCourses do

  it "should be accessible if non-null user" do
    CampusOracle::UserCourses.access_granted?(nil).should be_false
    CampusOracle::UserCourses.access_granted?('211159').should be_true
    client = CampusOracle::UserCourses.new({user_id: '211159'})
    client.get_all_campus_courses.should_not be_nil
  end

  it "should return pre-populated test enrollments for all semesters", :if => Sakai::SakaiData.test_data? do
    Settings.sakai_proxy.academic_terms.stub(:student).and_return(nil)
    Settings.sakai_proxy.academic_terms.stub(:instructor).and_return(nil)
    client = CampusOracle::UserCourses.new({user_id: '300939'})
    courses = client.get_all_campus_courses
    courses.empty?.should be_false
    courses["2012-B"].length.should == 2
    courses["2013-D"].length.should == 2
    courses["2013-D"].each do |course|
      course[:id].blank?.should be_false
      course[:slug].blank?.should be_false
      course[:emitter].should == 'Campus'
      course[:name].blank?.should be_false
      expect(course[:course_code_section]).to be_blank
      expect(course[:cred_cd]).to be_blank
      expect(course[:pnp_flag]).to be_blank
      expect(course[:unit]).to be_blank
      ['Student', 'Instructor'].include?(course[:role]).should be_true
      sections = course[:sections]
      sections.length.should be > 0
      sections.each do |section|
        if section[:ccn] == "16171"
          section[:instruction_format].blank?.should be_false
          section[:section_number].blank?.should be_false
          section[:is_primary_section].should be_true
          section.should be_has_key(:cred_cd)
          section[:pnp_flag].should eq 'N '
          section[:unit].should eq 3
          section[:instructors].length.should == 1
          section[:instructors][0][:name].present?.should be_true
          section[:schedules][0][:schedule].should == "TuTh 2:00P-3:30P"
          section[:schedules][0][:buildingName].should == "WHEELER"
        end
      end
    end
  end

  it 'includes nested sections for instructors', :if => Sakai::SakaiData.test_data? do
    client = CampusOracle::UserCourses.new({user_id: '238382'})
    courses = client.get_all_campus_courses
    sections = courses['2013-D'].select {|c| c[:dept] == 'BIOLOGY' && c[:catid] == '1A'}.first[:sections]
    expect(sections.size).to eq 3
    # One primary and two nested secondaries.
    expect(sections.collect{|s| s[:ccn]}).to eq ['07309', '07366', '07372']
  end

  it 'prefixes short CCNs with zeroes', :if => Sakai::SakaiData.test_data? do
    client = CampusOracle::UserCourses.new({user_id: '238382'})
    courses = client.get_selected_sections(2013, 'D', [7309])
    sections = courses['2013-D'].first[:sections]
    expect(sections.size).to eq 1
    expect(sections.first[:ccn]).to eq '07309'
  end

  it "should find waitlisted status in test enrollments", :if => Sakai::SakaiData.test_data? do
    Settings.sakai_proxy.academic_terms.stub(:student).and_return(nil)
    Settings.sakai_proxy.academic_terms.stub(:instructor).and_return(nil)
    client = CampusOracle::UserCourses.new({user_id: '300939'})
    courses = client.get_all_campus_courses
    courses["2015-B"].length.should == 1
    course_primary = courses["2015-B"][0][:sections][0]
    course_primary[:waitlistPosition].should == 42
    course_primary[:enroll_limit].should == 5000
  end

  it "should say that Tammi has student history", :if => Sakai::SakaiData.test_data? do
    client = CampusOracle::UserCourses.new({user_id: '300939'})
    client.has_student_history?.should be_true
  end

  it "should say that our fake teacher has instructor history", :if => Sakai::SakaiData.test_data? do
    client = CampusOracle::UserCourses.new({user_id: '238382'})
    client.has_instructor_history?.should be_true
  end

  describe '#merge_enrollments' do
    let(:user_id) {rand(99999).to_s}
    let(:catalog_id) {"#{rand(999)}"}
    let(:term_yr) {CampusOracle::Queries.current_year}
    let(:term_cd) {CampusOracle::Queries.current_term}
    context 'student in two primary sections with the same department and catalog ID' do
      let(:base_enrollment) {
        {
          'dept_description' => 'Public Health',
          'term_yr' => term_yr,
          'term_cd' => term_cd,
          'enroll_status' => 'E',
          'course_title' => 'Field Study in Public Health',
          'dept_name' => 'PB HLTH',
          'catalog_id' => '297',
          'primary_secondary_cd' => 'P',
          'instruction_format' => 'FLD',
          'catalog_root' => '297',
          'enroll_limit' => 40,
          'cred_cd' => 'SU'
        }
      }
      let(:fake_enrollments) {
        [
          base_enrollment.merge({
            'course_cntl_num' => '76378',
            'enroll_status' => 'E',
            'pnp_flag' => 'Y ',
            'unit' => '3',
            'section_num' => '012',
            'wait_list_seq_num' => 0
          }),
          base_enrollment.merge({
            'course_cntl_num' => '76392',
            'enroll_status' => 'W',
            'pnp_flag' => 'N ',
            'unit' => '2',
            'section_num' => '021',
            'wait_list_seq_num' => 2
          })
        ]
      }
      let(:feed) { {} }
      before {CampusOracle::Queries.stub(:get_enrolled_sections).and_return(fake_enrollments)}
      subject {
        CampusOracle::UserCourses.new(user_id: user_id).merge_enrollments(feed)
        feed["#{term_yr}-#{term_cd}"]
      }
      its(:size) {should eq 1}
      it 'includes only course info at the course level' do
        course = subject.first
        expect(course[:course_code]).to eq "#{base_enrollment['dept_name']} #{base_enrollment['catalog_id']}"
        expect(course[:catid]).to eq base_enrollment['catalog_id']
        expect(course[:cred_cd]).to be_nil
        expect(course[:pnp_flag]).to be_nil
        expect(course[:cred_cd]).to be_nil
      end
      it 'includes grading information in each primary section' do
        course = subject.first
        expect(course[:sections].size).to eq 2
        [course[:sections], fake_enrollments].transpose.each do |section, enrollment|
          expect(section[:instruction_format]).to eq enrollment['instruction_format']
          expect(section[:section_label]).to_not be_empty
          expect(section[:section_number]).to eq enrollment['section_num']
          expect(section[:ccn]).to eq enrollment['course_cntl_num']
          expect(section[:cred_cd]).to eq enrollment['cred_cd']
          expect(section[:pnp_flag]).to eq enrollment['pnp_flag']
          expect(section[:section_number]).to eq enrollment['section_num']
          expect(section[:unit]).to eq enrollment['unit']
          expect(section[:waitlistPosition]).to eq enrollment['wait_list_seq_num'] if enrollment['enroll_status'] == 'W'
        end
      end
    end
  end

  describe '#course_ids_from_row' do
    let(:row) {{
      'catalog_id' => "0109AL",
      'dept_name' => 'MEC ENG/I,RES',
      'term_yr' => '2014',
      'term_cd' => 'B'
    }}
    subject {CampusOracle::UserCourses.new(user_id: rand(99)).course_ids_from_row(row)}
    its([:slug]) {should eq "mec_eng_i_res-0109al"}
    its([:id]) {should eq "mec_eng_i_res-0109al-2014-B"}
    its([:course_code]) {should eq 'MEC ENG/I,RES 0109AL'}
  end

end
