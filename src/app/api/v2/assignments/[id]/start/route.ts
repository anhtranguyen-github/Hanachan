import { NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;
    
    // Logic to start/unlock assignment
    // In our system, this means transitioning from 'new' to 'learning'
    const { data: assignment, error: fetchError } = await supabase
      .from('user_learning_states')
      .select('*')
      .eq('id', assignmentId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('user_learning_states')
      .update({
        state: 'learning',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Return the updated assignment in WK format
    const results = await wanikaniApiService.listAssignments(user.id, { subject_ids: [assignment.ku_id] });
    
    return NextResponse.json(results.data[0]);
  } catch (error: any) {
    console.error('Error starting assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
