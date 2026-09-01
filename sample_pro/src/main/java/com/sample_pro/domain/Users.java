package com.sample_pro.domain;

public class Users implements java.io.Serializable {
	private static final long serialVersionUID = 1L;
	
	public String ck_date;
	public String a_3;
	public String a_4;
	public String a_5;
	
	
	
	
	//tb_standard_doc 
	public String mch_name;
	public String cr_date;
	public String box1;
	public String  box2;
	public String box3;
	public String  box4;
	
	
	

	
	
	//카
	public String e_date;
	public String idx;
	public String car_date;
	public String a_1;
	public String a_2;
	public String b_1;
	public String b_2;
	public String c_1;
	public String c_2;
	public String d_1;
	public String d_2;
	public String e_1;
	public String e_2;
	public String f_1;
	public String f_2;
	public String g_1;
	public String g_2;
	public String h_1;
	public String h_2;
	public String i_1;
	public String i_2;
	public String j_1;
	public String j_2;

	

	public String a1;
	public String a2;
	public String a3;
	public String a4;
	public String a5;
	public String a6;
	public String a7;
	public String a8;
	public String b1;
	public String b2;
	public String b3;
	public String b4;
	public String b5;
	public String b6;
	public String b7;
	public String b8;

	
	
	
	
	
	
	
	private String column;
	private String value;
	private String date;
	private String s_date;
	private String s_time;

	//tb_user테이블(작업자 등록)
	private String user_code;
	private String user_id;
	private String user_pw;
	private String user_level;
	private String user_name;
	private String user_busu;
	private String user_jick;
	private String user_phone;
	private String user_yn;
	private String start_day;
	private String st_day;
	//tb_plan_manage
    private String no;
    private String u_code;
    private String duty;
    private String employee_no;
    private String name;
    private String education;
    private String career;
    private String training;
    private String cert_name;
    private String acquisition_date;
    private String next_date;

    private String note;
    
    private String startDate;
    private String endDate;
    private String file_name;
    
	
    
    private Integer id;
    private String category;      // 구분
    private String day_shift;      // 주간
    private String night_shift;    // 야간

    
    
  
    private String task;               // 업무
    private String team_a;             // A조
    private String team_b;             // B조
    private String team_c;             // C조
    private String sub_task;           // 업무2
    private String always_day_shift;    // 상시주간
    
    
    private String b_f;
    private String ex1;
    private String ex2;	
    private String ex3;
 
    
    
    
    

    private String division;        // 구분
    private String shift_type;      // 주/야
    private String line_leader;     // 라인장
    private String degreasing;      // 탈유탈지
    private String shot;            // 쇼트
    private String g800;            // G-800
    private String g600;            // G-600
    private String common;          // 공용설비
    private String k_black;         // K-BLACK
    private String liquid_mgmt;     // 액관리
    private String e_coating;       // e-coating
    private String group_leader;    // 그룹장
    private String rust;            // 방청
    private String lab;             // 실험
    private String memo;            // 메모
    
    
    
    
    
    
    
    
    
	public String getCk_date() {
		return ck_date;
	}
	public void setCk_date(String ck_date) {
		this.ck_date = ck_date;
	}
	public String getA_3() {
		return a_3;
	}
	public void setA_3(String a_3) {
		this.a_3 = a_3;
	}
	public String getA_4() {
		return a_4;
	}
	public void setA_4(String a_4) {
		this.a_4 = a_4;
	}
	public String getA_5() {
		return a_5;
	}
	public void setA_5(String a_5) {
		this.a_5 = a_5;
	}
	public String getMch_name() {
		return mch_name;
	}
	public void setMch_name(String mch_name) {
		this.mch_name = mch_name;
	}
	public String getCr_date() {
		return cr_date;
	}
	public void setCr_date(String cr_date) {
		this.cr_date = cr_date;
	}
	public String getBox1() {
		return box1;
	}
	public void setBox1(String box1) {
		this.box1 = box1;
	}
	public String getBox2() {
		return box2;
	}
	public void setBox2(String box2) {
		this.box2 = box2;
	}
	public String getBox3() {
		return box3;
	}
	public void setBox3(String box3) {
		this.box3 = box3;
	}
	public String getBox4() {
		return box4;
	}
	public void setBox4(String box4) {
		this.box4 = box4;
	}
	public String getE_date() {
		return e_date;
	}
	public void setE_date(String e_date) {
		this.e_date = e_date;
	}
	public String getIdx() {
		return idx;
	}
	public void setIdx(String idx) {
		this.idx = idx;
	}
	public String getCar_date() {
		return car_date;
	}
	public void setCar_date(String car_date) {
		this.car_date = car_date;
	}
	public String getA_1() {
		return a_1;
	}
	public void setA_1(String a_1) {
		this.a_1 = a_1;
	}
	public String getA_2() {
		return a_2;
	}
	public void setA_2(String a_2) {
		this.a_2 = a_2;
	}
	public String getB_1() {
		return b_1;
	}
	public void setB_1(String b_1) {
		this.b_1 = b_1;
	}
	public String getB_2() {
		return b_2;
	}
	public void setB_2(String b_2) {
		this.b_2 = b_2;
	}
	public String getC_1() {
		return c_1;
	}
	public void setC_1(String c_1) {
		this.c_1 = c_1;
	}
	public String getC_2() {
		return c_2;
	}
	public void setC_2(String c_2) {
		this.c_2 = c_2;
	}
	public String getD_1() {
		return d_1;
	}
	public void setD_1(String d_1) {
		this.d_1 = d_1;
	}
	public String getD_2() {
		return d_2;
	}
	public void setD_2(String d_2) {
		this.d_2 = d_2;
	}
	public String getE_1() {
		return e_1;
	}
	public void setE_1(String e_1) {
		this.e_1 = e_1;
	}
	public String getE_2() {
		return e_2;
	}
	public void setE_2(String e_2) {
		this.e_2 = e_2;
	}
	public String getF_1() {
		return f_1;
	}
	public void setF_1(String f_1) {
		this.f_1 = f_1;
	}
	public String getF_2() {
		return f_2;
	}
	public void setF_2(String f_2) {
		this.f_2 = f_2;
	}
	public String getG_1() {
		return g_1;
	}
	public void setG_1(String g_1) {
		this.g_1 = g_1;
	}
	public String getG_2() {
		return g_2;
	}
	public void setG_2(String g_2) {
		this.g_2 = g_2;
	}
	public String getH_1() {
		return h_1;
	}
	public void setH_1(String h_1) {
		this.h_1 = h_1;
	}
	public String getH_2() {
		return h_2;
	}
	public void setH_2(String h_2) {
		this.h_2 = h_2;
	}
	public String getI_1() {
		return i_1;
	}
	public void setI_1(String i_1) {
		this.i_1 = i_1;
	}
	public String getI_2() {
		return i_2;
	}
	public void setI_2(String i_2) {
		this.i_2 = i_2;
	}
	public String getJ_1() {
		return j_1;
	}
	public void setJ_1(String j_1) {
		this.j_1 = j_1;
	}
	public String getJ_2() {
		return j_2;
	}
	public void setJ_2(String j_2) {
		this.j_2 = j_2;
	}
	public String getA1() {
		return a1;
	}
	public void setA1(String a1) {
		this.a1 = a1;
	}
	public String getA2() {
		return a2;
	}
	public void setA2(String a2) {
		this.a2 = a2;
	}
	public String getA3() {
		return a3;
	}
	public void setA3(String a3) {
		this.a3 = a3;
	}
	public String getA4() {
		return a4;
	}
	public void setA4(String a4) {
		this.a4 = a4;
	}
	public String getA5() {
		return a5;
	}
	public void setA5(String a5) {
		this.a5 = a5;
	}
	public String getA6() {
		return a6;
	}
	public void setA6(String a6) {
		this.a6 = a6;
	}
	public String getA7() {
		return a7;
	}
	public void setA7(String a7) {
		this.a7 = a7;
	}
	public String getA8() {
		return a8;
	}
	public void setA8(String a8) {
		this.a8 = a8;
	}
	public String getB1() {
		return b1;
	}
	public void setB1(String b1) {
		this.b1 = b1;
	}
	public String getB2() {
		return b2;
	}
	public void setB2(String b2) {
		this.b2 = b2;
	}
	public String getB3() {
		return b3;
	}
	public void setB3(String b3) {
		this.b3 = b3;
	}
	public String getB4() {
		return b4;
	}
	public void setB4(String b4) {
		this.b4 = b4;
	}
	public String getB5() {
		return b5;
	}
	public void setB5(String b5) {
		this.b5 = b5;
	}
	public String getB6() {
		return b6;
	}
	public void setB6(String b6) {
		this.b6 = b6;
	}
	public String getB7() {
		return b7;
	}
	public void setB7(String b7) {
		this.b7 = b7;
	}
	public String getB8() {
		return b8;
	}
	public void setB8(String b8) {
		this.b8 = b8;
	}
	public String getB_f() {
		return b_f;
	}
	public void setB_f(String b_f) {
		this.b_f = b_f;
	}
	public String getEx1() {
		return ex1;
	}
	public void setEx1(String ex1) {
		this.ex1 = ex1;
	}
	public String getEx2() {
		return ex2;
	}
	public void setEx2(String ex2) {
		this.ex2 = ex2;
	}
	public String getEx3() {
		return ex3;
	}
	public void setEx3(String ex3) {
		this.ex3 = ex3;
	}
	public String getColumn() {
		return column;
	}
	public void setColumn(String column) {
		this.column = column;
	}
	public String getValue() {
		return value;
	}
	public void setValue(String value) {
		this.value = value;
	}
	public String getDate() {
		return date;
	}
	public void setDate(String date) {
		this.date = date;
	}
	public String getS_date() {
		return s_date;
	}
	public void setS_date(String s_date) {
		this.s_date = s_date;
	}
	public String getS_time() {
		return s_time;
	}
	public void setS_time(String s_time) {
		this.s_time = s_time;
	}
	public String getUser_code() {
		return user_code;
	}
	public void setUser_code(String user_code) {
		this.user_code = user_code;
	}
	public String getUser_id() {
		return user_id;
	}
	public void setUser_id(String user_id) {
		this.user_id = user_id;
	}
	public String getUser_pw() {
		return user_pw;
	}
	public void setUser_pw(String user_pw) {
		this.user_pw = user_pw;
	}
	public String getUser_level() {
		return user_level;
	}
	public void setUser_level(String user_level) {
		this.user_level = user_level;
	}
	public String getUser_name() {
		return user_name;
	}
	public void setUser_name(String user_name) {
		this.user_name = user_name;
	}
	public String getUser_busu() {
		return user_busu;
	}
	public void setUser_busu(String user_busu) {
		this.user_busu = user_busu;
	}
	public String getUser_jick() {
		return user_jick;
	}
	public void setUser_jick(String user_jick) {
		this.user_jick = user_jick;
	}
	public String getUser_phone() {
		return user_phone;
	}
	public void setUser_phone(String user_phone) {
		this.user_phone = user_phone;
	}
	public String getUser_yn() {
		return user_yn;
	}
	public void setUser_yn(String user_yn) {
		this.user_yn = user_yn;
	}
	public String getStart_day() {
		return start_day;
	}
	public void setStart_day(String start_day) {
		this.start_day = start_day;
	}
	public String getSt_day() {
		return st_day;
	}
	public void setSt_day(String st_day) {
		this.st_day = st_day;
	}
	public String getNo() {
		return no;
	}
	public void setNo(String no) {
		this.no = no;
	}
	public String getU_code() {
		return u_code;
	}
	public void setU_code(String u_code) {
		this.u_code = u_code;
	}
	public String getDuty() {
		return duty;
	}
	public void setDuty(String duty) {
		this.duty = duty;
	}
	public String getEmployee_no() {
		return employee_no;
	}
	public void setEmployee_no(String employee_no) {
		this.employee_no = employee_no;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getEducation() {
		return education;
	}
	public void setEducation(String education) {
		this.education = education;
	}
	public String getCareer() {
		return career;
	}
	public void setCareer(String career) {
		this.career = career;
	}
	public String getTraining() {
		return training;
	}
	public void setTraining(String training) {
		this.training = training;
	}
	public String getCert_name() {
		return cert_name;
	}
	public void setCert_name(String cert_name) {
		this.cert_name = cert_name;
	}
	public String getAcquisition_date() {
		return acquisition_date;
	}
	public void setAcquisition_date(String acquisition_date) {
		this.acquisition_date = acquisition_date;
	}
	public String getNext_date() {
		return next_date;
	}
	public void setNext_date(String next_date) {
		this.next_date = next_date;
	}
	public String getNote() {
		return note;
	}
	public void setNote(String note) {
		this.note = note;
	}
	public String getStartDate() {
		return startDate;
	}
	public void setStartDate(String startDate) {
		this.startDate = startDate;
	}
	public String getEndDate() {
		return endDate;
	}
	public void setEndDate(String endDate) {
		this.endDate = endDate;
	}
	public String getFile_name() {
		return file_name;
	}
	public void setFile_name(String file_name) {
		this.file_name = file_name;
	}

	public Integer getId() {
		return id;
	}
	public void setId(Integer id) {
		this.id = id;
	}
	public String getCategory() {
		return category;
	}
	public void setCategory(String category) {
		this.category = category;
	}
	public String getDay_shift() {
		return day_shift;
	}
	public void setDay_shift(String day_shift) {
		this.day_shift = day_shift;
	}
	public String getNight_shift() {
		return night_shift;
	}
	public void setNight_shift(String night_shift) {
		this.night_shift = night_shift;
	}
	public String getTask() {
		return task;
	}
	public void setTask(String task) {
		this.task = task;
	}
	public String getTeam_a() {
		return team_a;
	}
	public void setTeam_a(String team_a) {
		this.team_a = team_a;
	}
	public String getTeam_b() {
		return team_b;
	}
	public void setTeam_b(String team_b) {
		this.team_b = team_b;
	}
	public String getTeam_c() {
		return team_c;
	}
	public void setTeam_c(String team_c) {
		this.team_c = team_c;
	}
	public String getSub_task() {
		return sub_task;
	}
	public void setSub_task(String sub_task) {
		this.sub_task = sub_task;
	}
	public String getAlways_day_shift() {
		return always_day_shift;
	}
	public void setAlways_day_shift(String always_day_shift) {
		this.always_day_shift = always_day_shift;
	}
	public String getDivision() {
		return division;
	}
	public void setDivision(String division) {
		this.division = division;
	}
	public String getShift_type() {
		return shift_type;
	}
	public void setShift_type(String shift_type) {
		this.shift_type = shift_type;
	}
	public String getLine_leader() {
		return line_leader;
	}
	public void setLine_leader(String line_leader) {
		this.line_leader = line_leader;
	}
	public String getDegreasing() {
		return degreasing;
	}
	public void setDegreasing(String degreasing) {
		this.degreasing = degreasing;
	}
	public String getShot() {
		return shot;
	}
	public void setShot(String shot) {
		this.shot = shot;
	}
	public String getG800() {
		return g800;
	}
	public void setG800(String g800) {
		this.g800 = g800;
	}
	public String getG600() {
		return g600;
	}
	public void setG600(String g600) {
		this.g600 = g600;
	}
	public String getCommon() {
		return common;
	}
	public void setCommon(String common) {
		this.common = common;
	}
	public String getK_black() {
		return k_black;
	}
	public void setK_black(String k_black) {
		this.k_black = k_black;
	}
	public String getLiquid_mgmt() {
		return liquid_mgmt;
	}
	public void setLiquid_mgmt(String liquid_mgmt) {
		this.liquid_mgmt = liquid_mgmt;
	}
	public String getE_coating() {
		return e_coating;
	}
	public void setE_coating(String e_coating) {
		this.e_coating = e_coating;
	}
	public String getGroup_leader() {
		return group_leader;
	}
	public void setGroup_leader(String group_leader) {
		this.group_leader = group_leader;
	}
	public String getRust() {
		return rust;
	}
	public void setRust(String rust) {
		this.rust = rust;
	}
	public String getLab() {
		return lab;
	}
	public void setLab(String lab) {
		this.lab = lab;
	}
	public String getMemo() {
		return memo;
	}
	public void setMemo(String memo) {
		this.memo = memo;
	}
    

    
    
    
   
}
