-- إنشاء جدول سجل العمليات
CREATE OR REPLACE FUNCTION public.create_audit_log_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من وجود الجدول
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
        -- إنشاء الجدول إذا لم يكن موجوداً
        CREATE TABLE public.audit_log (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            action VARCHAR(255) NOT NULL,
            details JSONB,
            user_id UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::text, NOW()) NOT NULL
        );

        -- إنشاء السياسات
        CREATE POLICY "Enable read access for authenticated users" 
            ON public.audit_log FOR SELECT 
            TO authenticated 
            USING (true);

        CREATE POLICY "Enable insert access for authenticated users" 
            ON public.audit_log FOR INSERT 
            TO authenticated 
            WITH CHECK (true);

        -- تفعيل RLS
        ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

        -- إنشاء الفهارس
        CREATE INDEX idx_audit_log_action ON public.audit_log(action);
        CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
        CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
    END IF;
END;
$$;
